"use strict";
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;

function getDatabaseIP() {
    const configPath = path.resolve(__dirname, '../../config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return config.databaseIP;
}

async function createPool() {
    if (pool) {
        console.log('[Database] Closing old pool.');
        await pool.end();
    }

    pool = new Pool({
      user: process.env.DB_USER,
      host: getDatabaseIP(),
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT),
    
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    console.log('[Database] New pool created for new host.');
}

async function getPool() {
    if (!pool) {
        await createPool();
    }
    return pool;
}

async function testConnection(retries = 5, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await pool.query('SELECT 1');
            console.log(`[Database] Connected successfully on attempt ${attempt}.`);
            return true;
        } catch (err) {
            console.warn(`[Database] Attempt ${attempt} failed: ${err.message}`)

            if (attempt < retries) {
                await new Promise((res) => setTimeout(res,delay));
            } else {
                console.error('[Database] All connection attempts failed.');
                return false;
            }
        }
    }
}

module.exports = { createPool, getPool, testConnection };
