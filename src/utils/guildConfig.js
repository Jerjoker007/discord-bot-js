const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../../guild-data/guildData.json');
let config = null;

function loadConfig() {
    if (!config) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return config;
}

function saveConfig() {
    if (config) {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
}

function getGuildConfig(guildId) {
    const cfg = loadConfig();
    if (!cfg[guildId]) {
        cfg[guildId]  = { channels: {} };
        saveConfig();
    }
    return cfg[guildId];
}

function updateGuildConfig(guildId, updateFn) {
    const cfg = getGuildConfig(guildId);
    updateFn(cfg);
    saveConfig();
}

module.exports = {
    getGuildConfig,
    updateGuildConfig
}