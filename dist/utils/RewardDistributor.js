"use strict";
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // adjust your connection settings
});

class RewardDistributor {

  constructor(batchPath, rewardPath, db) {
    this.batchPath = batchPath;
    this.rewardPath = rewardPath;
    this.batchData = null;
    this.rewardData = null;
    this.db = db;
  }

  async loadFiles() {
      try {
        const batchFile = await fs.readFile(path.resolve(this.batchPath), 'utf-8');
        const rewardFile = await fs.readFile(path.resolve(this.rewardPath), 'utf-8');
        this.batchData = JSON.parse(batchFile);
        this.rewardData = JSON.parse(rewardFile);
      } catch (err) {
        throw new Error('Error loading JSON files: ' + err.message);
      }
  }

  getUserIds(batchKey) {
    if (!this.batchData || !this.batchData[batchKey]) return [];
    return Object.keys(this.batchData[batchKey]);
  }

  getRewardData() {
    if (!this.rewardData) return null;
    const { bountyCoins, gachaTickets, items } = this.rewardData;
    return { bountyCoins, gachaTickets, items };
  }

  formatHex(num, padding) {
    return num.toString(16).toUpperCase().padStart(padding, "0");
  }

  /// to format LSB to MSB in hex
  reverseHex(hex) {
    return hex.slice(2, 4) + hex.slice(0, 2);
  }

  /// the main function that you will need
  toHexString() {
    //invalidate the opration if no selected item
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
    console.log("Hex =", hexData);

    const itemCount = parseInt(hexData.slice(0, 4), 16);
    console.log("Count =", itemCount);

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

    const insertDistributionQuery = await this.db.query(
      `
        INSERT INTO distribution (character_id,data,type,bot,event_name,description)
        SELECT * FROM UNNEST($1::int[], DECODE($2::string[], 'hex'), $3::int[], $4::bool[], $5::string[], $6::string[])
        RETURNING id
      `,
      [
        charIds,
        Array(charIds.length).fill(hex),
        Array(charIds.length).fill(1),
        Array(charIds.length).fill(true),
        Array(charIds.length).fill('Event BBQ25'),
        Array(charIds.length).fill(`~C05 Raviente's Bounty`)
      ]
    )

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
    )
  }

  async distribute(batchKey) {
    const userIds = this.getUserIds(batchKey);
    const charIds = this.getCharacterIds(batchKey);
    const rewards = this.getRewardData();
    if (!userIds.length || !rewards) {
      throw new Error('Missing user or reward data.');
    }

    console.log("Distributing to users:", userIds);
    console.log("With rewards:", rewards);

    const dbTransaction = await this.db.connect();
    try {
      const hex = this.toHexString();
      await dbTransaction.query('BEGIN');
      this.distributeItems(charIds, hex);

      await dbTransaction.query('COMMIT');
    } catch (err) {
      await dbTransaction.query('ROLLBACK');
      throw err;
    } finally {
      dbTransaction.release();
    }


  }
}

module.exports = RewardDistributor;