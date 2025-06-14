"use strict";
const { Client, Interaction } = require('discord.js');
const { devs, testServer } = require('../../../config.json');
const { decodeCustomId } = require('../../utils/customId');
const getLocalSelectMenu = require('../../utils/getLocalSelectMenu');

/**
 * 
 * @param {Client} client 
 * @param {Interaction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
    if (!interaction.isStringSelectMenu()) return;

    const localSelectMenu = getLocalSelectMenu();
    const { botName, action, params } = decodeCustomId(interaction.customId);

    if (botName !== 'ravi') return;
    
    try {
        const selectMenuObject = localSelectMenu.find(btn => btn.name === action);
    
        if (!selectMenuObject) return;

        if (selectMenuObject.devOnly) {
            if (!devs.includes(interaction.member.id)) {
                interaction.reply({
                    content: 'Only developpers are allowed to run this command.',
                    ephemeral: true,
                });
                return;
            }
        }
        if (selectMenuObject.testOnly) {
            if (!(interaction.guild.id === testServer)) {
                interaction.reply({
                    content: 'This command cannot be ran here.',
                    ephemeral: true,
                });
                return;
            }
        }
        if (selectMenuObject.permissionsRequired?.length) {
            for (const permission of selectMenuObject.permissionsRequired) {
                if (!interaction.member.permissions.has(permission)) {
                    interaction.reply({
                        content: 'You do not have sufficient permission to run this command.',
                        ephemeral: true,
                    });
                    return;
                }
            }
        }

        await selectMenuObject.callback(client, interaction, params);

    } catch (err) {
        console.log(`Error running select menu: ${err}`);
        await interaction.reply({ content: 'There was an error with that select menu interaction.', flags: MessageFlags.Ephemeral });
    }
};