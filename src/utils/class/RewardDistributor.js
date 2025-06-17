"use strict";
const fs = require('fs/promises');
const path = require('path');
const { submissionManager } = require('../../state/globalState');
const { EmbedBuilder } = require('discord.js');

class RewardDistributor {

  constructor(rewardPath, batchKey, interaction, db) {
    this.rewardPath = rewardPath;
    this.batchKey = batchKey;
    this.batchData = null;
    this.rewardData = null;
    this.interaction = interaction;
    this.db = db;
  }

  async loadFiles() {
      try {
        const rewardFile = await fs.readFile(path.resolve(this.rewardPath), 'utf-8');

        this.batchData = await submissionManager.fetchBatch(this.batchKey);
        this.rewardData = JSON.parse(rewardFile);

      } catch (err) {
        throw new Error('Error loading JSON files: ' + err.message);
      }
  }

  getUserIds() {
    if (!this.batchData || !this.batchData) return [];
    return Object.keys(this.batchData);
  }

  getCharacterIds() {
    if (!this.batchData || !this.batchData) return [];
    return Object.values(this.batchData).map(entry => parseInt(entry.char_id));
  }

  getRewardData() {
    if (!this.rewardData) return null;
    const { bountyCoins, gachaTickets, items } = this.rewardData;
    return { bountyCoins, gachaTickets, items };
  }

  formatHex(num, padding) {
    return num.toString(16).toUpperCase().padStart(padding, "0");
  }

  reverseHex(hex) {
    return hex.slice(2, 4) + hex.slice(0, 2);
  }

  toHexString() {
    if (this.rewardData.items.length === 0) {
      return
    }

    let result = this.formatHex(this.rewardData.items.length, 4);
    for (const item of this.rewardData.items) {
      result += `${this.formatHex(item.type, 2)}0000${this.reverseHex(item.code)}0000${this.formatHex(item.amount, 4)}00000000`;
    }
    return result;
  }

  hexToItems(hexData) {
    const itemCount = parseInt(hexData.slice(0, 4), 16);

    const items = [];
    let index = 4;

    for (let i = 0; i < itemCount; i++) {
        const type = parseInt(hexData.slice(index, index + 2), 16);
        index += 6; // 2 hex digits + 4 (padding "0000")

        const code = parseInt(hexData.slice(index, index + 4), 16);
        index += 8; // 4 hex digits + 4 (padding "0000")

        const count = parseInt(hexData.slice(index, index + 4), 16);
        index += 12; // 4 hex digits + 8 (padding "00000000")

        items.push({
            types: type,
            data: code,
            quantity: count,
        });
    }

    return items;
  }


  async distributeItems(charIds, hex) {
    if (hex === undefined) return;

    const dataBuffer = Buffer.from(hex, 'hex');

    const insertDistributionQuery = await this.db.query(
      `
        INSERT INTO distribution (char_id,data,type,bot,event_name,description)
        SELECT * FROM UNNEST($1::int[], $2::bytea[], $3::int[], $4::bool[], $5::text[], $6::text[])
        RETURNING id
      `,
      [
        charIds,
        Array(charIds.length).fill(dataBuffer),
        Array(charIds.length).fill(1),
        Array(charIds.length).fill(false),
        Array(charIds.length).fill('Event BBQ25'),
        Array(charIds.length).fill(`~C05 Raviente's Bounty`)
      ]
    );

    const distIds = insertDistributionQuery.rows.map((row) => row.id);

    const ids = [];
    const types = [];
    const codes = [];
    const amounts = [];

    const items = this.hexToItems(hex);
    for (const distId of distIds) {
      for (const item of items) {
        ids.push(distId);
        types.push(item.types);
        codes.push(item.data);
        amounts.push(item.quantity);
      }
    }

    await this.db.query(
      `
        INSERT INTO distribution_items (distribution_id, item_type, item_id, quantity)
        SELECT * FROM UNNEST($1::int[], $2::int[], $3::int[], $4::int[])
      `,
      [
        ids,
        types,
        codes,
        amounts
      ]
    );
  }

  async distributeDiscordRewards(rewards) {
    const userEntries = Object.entries(this.batchData);

    const userIds = [];
    const updatedBountyCoins = [];
    const updatedGachaTickets = [];

    for (const [userId, data] of userEntries) {
      userIds.push(userId);
      updatedBountyCoins.push((data.bounty + (rewards.bountyCoins * (1.0 + data.bcMultiplier))));
      updatedGachaTickets.push((data.gacha + rewards.gachaTickets));
    }

    await this.db.query(
      `
        UPDATE discord d SET 
          bounty = data.new_bounty,
          gacha = data.new_gacha
        FROM (
          SELECT
            UNNEST($1::text[]) AS discord_id,
            UNNEST($2::int[]) AS new_bounty,
            UNNEST($3::int[]) AS new_gacha
        ) AS data
        WHERE d.discord_id = data.discord_id
      `,
      [
        userIds,
        updatedBountyCoins,
        updatedGachaTickets,
      ]
    );
  }

  async createBountyMessage(rewards) {
    const messages = [];
    for (const [userId, data] of Object.entries(this.batchData)) {
      const user = await this.interaction.client.users.fetch(userId);
      const content = `<@${userId}>'s Solo Event BBQ25 Reward already distributed`;
      let itemsField = '>>> ';
      for (const item of rewards.items) {
        itemsField += `${item.name} x${item.amount}\n`;
      }
      const embeds = new EmbedBuilder()
            .setAuthor({ name: `${user.username}`, iconURL: user.displayAvatarURL() })
            .setTitle('Bounty Reward')
            .setDescription(`<@${userId}>'s reward for Solo BBQ25 category Event`)
            .setColor(0x94fc03)
            .addFields([ 
              { name: 'Bounty Coin', value: `Bounty Reward: Bc ${rewards.bountyCoins}\nTitle Bonus: ${100 * data.bcMultiplier}%\nReward with Bonus: Bc ${rewards.bountyCoins * (1.0 + data.bcMultiplier)}`},
              { name: 'Gacha Tickets', value: `Ticket Reward: ${rewards.gachaTickets} Ticket(s)`},
              { name: 'Items/Equipment', value: itemsField }
            ]);
      messages.push({ content, embeds: [embeds]});
    }
    return messages;
  }

  async distribute() {

    const userIds = this.getUserIds();
    const characterIds = this.getCharacterIds();
    const rewards = this.getRewardData();

    if (!userIds.length || !rewards || !characterIds.length) {
      throw new Error('Missing user, reward data or character.');
    }

    console.log("Distributing to users:", userIds);
    console.log("With rewards:", rewards);

    const dbTransaction = await this.db.connect();
    try {
      const hex = this.toHexString();
      await dbTransaction.query('BEGIN');

      await this.distributeItems(characterIds, hex);
      await this.distributeDiscordRewards(rewards);

      await dbTransaction.query('COMMIT');

    } catch (err) {

      await dbTransaction.query('ROLLBACK');
      throw err;
      
    } finally {
      dbTransaction.release();
    }
    return await this.createBountyMessage(rewards);
  }
}

module.exports = RewardDistributor;