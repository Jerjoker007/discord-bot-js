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
    if (!this.batchData) return [];
    return Object.keys(this.batchData);
  }

  getCharacterIds() {
    if (!this.batchData) return [];
    return Object.values(this.batchData).map(entry => parseInt(entry.char_id));
  }

  getRewardData() {
    if (!this.rewardData) return null;
    const { bountyCoins, gachaTickets, items } = this.rewardData;
    return { 
      bountyCoins, 
      gachaTickets, 
      items: items.map((item) => ({
        ...item,
        code: parseInt(this.reverseHex(item.code), 16)
      })) 
    };
  }

  reverseHex(hex) {
    return hex.slice(2, 4) + hex.slice(0, 2);
  }

  formatNumber(value) {
    return new Intl.NumberFormat('de-CH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatHex(num, padding) {
    return num.toString(16).toUpperCase().padStart(padding, "0");
  }

  toHexString() {
    const { items } = this.rewardData;
    //invalidate the opration if no selected item
    if (items.length === 0) {
      return
    }
    let result = this.formatHex(items.length, 4);
    for (const item of items) {
      result += `${this.formatHex(item.type, 2)}0000${this.reverseHex(item.code)}0000${this.formatHex(item.amount, 4)}00000000`;
    }
    return result;
  }

  async distributeItems(charIds, rewards, dbTransaction) {
    if (!rewards.items || !rewards.bountyCoins || !rewards.gachaTickets) {
      return;
    }

    const dataString = Buffer.from(this.toHexString(), 'hex');

    const charCount = charIds.length;
    const typesArray = Array(charCount).fill(1);
    const botsArray = Array(charCount).fill(false);
    const dataArray = Array(charCount).fill(dataString);
    const eventNames = Array(charCount).fill('Event BBQ25');
    const descriptions = Array(charCount).fill("~C05 Raviente's Bounty");

    const itemTypes = [];
    const itemCodes = [];
    const itemAmounts = [];

    for (const item of rewards.items) {
      itemTypes.push(item.type);
      itemCodes.push(item.code);
      itemAmounts.push(item.amount)
    }

    await dbTransaction.query(
      `
        WITH dist AS (
          INSERT INTO distribution (character_id, type, bot, data, event_name, description)
          SELECT * FROM
            UNNEST ($1::INT[], $2::INT[], $3::BOOL[], $4::BYTEA[], $5::TEXT[], $6::TEXT[])
          RETURNING id
        )
        INSERT INTO distribution_items (distribution_id, item_type, item_id, quantity)
        SELECT dist.id, u.type, u.code, u.amount
        FROM dist
          CROSS JOIN UNNEST($7::INT[], $8::INT[], $9::INT[])
          AS u(type, code, amount)
      `,
      [
        charIds,
        typesArray,
        botsArray,
        dataArray,
        eventNames,
        descriptions,
        itemTypes,
        itemCodes,
        itemAmounts
      ]
    );
  }

  async distributeDiscordRewards(userEntries, rewards, dbTransaction) {
    
    const userIds = userEntries.map(([userId]) => userId);

    const result = await dbTransaction.query(
      `
        UPDATE discord d SET 
          bounty = d.bounty + (
            CASE
              WHEN (d.title & 4) > 0 THEN $2 * 1.4
              WHEN (d.title & 2) > 0 THEN $2 * 1.2
              WHEN (d.title & 1) > 0 THEN $2 * 1.1
              ELSE $2
            END
          ),
          gacha = d.gacha + $3,
          latest_bounty = '4_25'
        FROM (
          SELECT UNNEST($1::text[]) AS discord_id
        ) AS data
        WHERE d.discord_id = data.discord_id
        RETURNING d.discord_id, d.title,
          CASE
            WHEN (d.title & 4) > 0 THEN  0.4
            WHEN (d.title & 2) > 0 THEN 0.2
            WHEN (d.title & 1) > 0 THEN 0.1
            ELSE 0.0
          END AS bc_multiplier
      `,
      [
        userIds,
        rewards.bountyCoins,
        rewards.gachaTickets,
      ]
    );

    for (const row of result.rows) {
      const { discord_id, bc_multiplier } = row;

      if (this.batchData[discord_id]) {
        this.batchData[discord_id].bcMultiplier = bc_multiplier;
      }
    }
  }

  async createBountyMessage( rewards) {
    const messages = [];
    const usersIds = Object.keys(this.batchData);

    const members = await Promise.all(usersIds.map(id => this.interaction.guild.members.fetch(id)));
    const users = members.map(member => member.user);

    for (let i = 0; i < usersIds.length; i++) {
      const userId = usersIds[i];
      const user = users[i];
      const data = this.batchData[userId];

      const mention = `<@${userId}>`;
      const content = `${mention}'s Solo Event BBQ25 Reward already distributed`;

      const itemsField = '>>> ' + rewards.items.map(item => `${item.name} x${item.amount}`).join('\n');

      const multiplier = parseFloat(data.bcMultiplier) ?? 0.0;
      const bonusPercent = (100 * multiplier).toFixed(0); 
      const bonusAmount = (rewards.bountyCoins * (1.0 + multiplier)).toFixed(0);

      const embeds = new EmbedBuilder()
            .setAuthor({ name: `${user.username}`, iconURL: user.displayAvatarURL() })
            .setTitle('Bounty Reward')
            .setDescription(`${mention}'s reward for Solo BBQ25 category Event`)
            .setColor(0x94fc03)
            .addFields([ 
              { name: 'Bounty Coin', value: `Bounty Reward: Bc ${this.formatNumber(rewards.bountyCoins)}\nTitle Bonus: ${bonusPercent}%\nReward with Bonus: Bc ${this.formatNumber(bonusAmount)}`},
              { name: 'Gacha Tickets', value: `Ticket Reward: ${rewards.gachaTickets} Ticket(s)`},
              { name: 'Items/Equipment', value: itemsField }
            ]);
      
      messages.push({ content, embeds: [embeds]});
    }

    return messages;
  }

  async distribute() {

    const userEntries = Object.entries(this.batchData);
    const characterIds = this.getCharacterIds();
    const rewards = this.getRewardData();

    if (!userEntries.length || !rewards || !characterIds.length) {
      throw new Error('Missing user, reward data or character.');
    }

    console.log("Distributing to users:", this.getUserIds());
    console.log("With rewards:", rewards);

    const dbTransaction = await this.db.connect();
    try {
      await dbTransaction.query('BEGIN');

      await this.distributeItems(characterIds, rewards, dbTransaction);
      await this.distributeDiscordRewards(userEntries, rewards, dbTransaction);

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