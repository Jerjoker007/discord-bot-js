"use strict";
const fs = require('fs');
const path = require('path');
const { MessageFlags } = require('discord.js');
const { devs, testServer } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');
const { getGuildConfig } = require('../../utils/guildConfig');

module.exports = async (client, interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const localCommands = getLocalCommands();
    try {
        const commandObject = localCommands.find((cmd) => cmd.name === interaction.commandName);
        const guildConfig = getGuildConfig(interaction.guild.id)?.permissions;
        const allowedRoles = guildConfig?.[commandObject.name] || [];
        if (!commandObject)return;
        
        if (commandObject.devOnly) {
            if (!devs.includes(interaction.member.id)) {
                interaction.reply({
                    content: 'Only developpers are allowed to run this command.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
        }
        if (commandObject.testOnly) {
            if (!(interaction.guild.id === testServer)) {
                interaction.reply({
                    content: 'This command cannot be ran here.',
                    flags: MessageFlags.Ephemeral,
                });
                return;
            }
        }
        if (commandObject.permissionsRequired?.length) {
            for (const permission of commandObject.permissionsRequired) {
                if (!interaction.member.permissions.has(permission)) {
                    interaction.reply({
                        content: 'You do not have sufficient permission to run this command.',
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }
            }
        }
        if (allowedRoles.length > 0) {
            const hasAllowedRole = interaction.member.roles.cache.some(role => allowedRoles.includes(role.id));

            if (!hasAllowedRole) {
                return interaction.reply({
                    content: 'You do not have the required role to use this command.',
                    flags: MessageFlags.Ephemeral,
                })
            }
        }
        
        await commandObject.callback(client, interaction);
    }
    catch (error) {
        console.log(`There was an error running this command: ${error}.`);
    }
};
