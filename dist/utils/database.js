"use strict";
const { Pool } = require('pg');

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_db',
  password: 'your_password',
  port: 5432,
});

async function testConnection(retries = 5, delay = 2000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await pool.query('SELECT 1');
            console.log(`[Database] Connected successfully on attempt ${attempt}.`);
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
