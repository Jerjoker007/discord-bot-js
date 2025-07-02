"use strict";
require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');
const { getPool, testConnection } = require('./utils/dbConnection');

(async () => {
    const pool = await getPool();
    if (!await testConnection()) {
        console.log('[Bot] Launching bot with no database.');
    }

    const client = new Client({
        intents: [
            IntentsBitField.Flags.Guilds,
            IntentsBitField.Flags.GuildMembers,
            IntentsBitField.Flags.GuildMessages,
            IntentsBitField.Flags.MessageContent,
        ],
    });

    client.db = pool;
    
    eventHandler(client);
    client.login(process.env.DISCORD_BOT_TOKEN);
})();