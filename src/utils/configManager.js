const fs = require('fs');
const path = require('path');

const guildConfigPath = path.join(__dirname, '../../guild-data/guildData.json');
const databaseConfigPath = path.join(__dirname, '../../config.json');
let guildConfig = null;
let config = null;

function loadGuildConfig() {
    if (!guildConfig) {
        guildConfig = JSON.parse(fs.readFileSync(guildConfigPath, 'utf-8'));
    }
    return guildConfig;
}

function saveConfig(cfg, chosenPath) {
    if (cfg) {
        fs.writeFileSync(chosenPath, JSON.stringify(cfg, null, 2));
    }
}

function getGuildConfig(guildId) {
    const cfg = loadGuildConfig();
    if (!cfg[guildId]) {
        cfg[guildId]  = { channels: {} };
        saveConfig(guildConfig, guildConfigPath);
    }
    return cfg[guildId];
}

function updateGuildConfig(guildId, updateFn) {
    const cfg = getGuildConfig(guildId);
    updateFn(cfg);
    saveConfig(guildConfig, guildConfigPath);
}

function loadConfig() {
    if (!config) {
        config = JSON.parse(fs.readFileSync(databaseConfigPath, 'utf-8'));
    }
    return config;
}

function updateConfig(updateFn) {
    const cfg = loadConfig();
    updateFn(cfg);
    saveConfig(config, databaseConfigPath);
}

module.exports = {
    getGuildConfig,
    updateGuildConfig,
    updateConfig
}