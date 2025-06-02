"use strict";
require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');
const { pool, testConnection } = require('./utils/database');

(async () => {
    await testConnection()

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