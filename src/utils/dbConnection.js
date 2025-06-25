"use strict";
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function testConnection(retries = 5, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await pool.query('SELECT 1');
            console.log(`[Database] Connected successfully on attempt ${attempt}.`);
            break;
        } catch (err) {
            console.warn(`[Database] Attempt ${attempt} failed: ${err.message}`)

            if (attempt < retries) {
                await new Promise((res) => setTimeout(res,delay));
            } else {
                console.error('[Database] All connection attempts failed. Exiting...')
                process.exit(1);
            }
        }
    }
}

module.exports = { pool, testConnection, };
