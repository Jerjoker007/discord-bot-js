"use strict";
const { Client, Interaction, MessageFlags } = require('discord.js');
const { devs } = require('../../../config.json');
const { decodeCustomId } = require('../../utils/customId');
const getLocalButtons = require('../../utils/getLocalButtons');

/**
 * 
 * @param {Client} client 
 * @param {Interaction} interaction 
 * @returns 
 */
module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;

    const submitChannelId = '1374042127121518785';

    const localButtons = getLocalButtons();
    const { botName, action, params } = decodeCustomId(interaction.customId);

    if (botName !== 'ravi') return;
    
    try {
        const buttonObject = localButtons.find(btn => btn.name === action);
    
        if (!buttonObject) return;

        if (buttonObject.devOnly) {
            if (!devs.includes(interaction.member.id)) {
                interaction.reply({
                    content: 'Only developpers are allowed to run this command.',
                    ephemeral: true,
                });
                return;
            }
        }
        if (buttonObject.testOnly) {
            if (!(interaction.guild.id === testServer)) {
                interaction.reply({
                    content: 'This command cannot be ran here.',
                    ephemeral: true,
                });
                return;
            }
        }
        if (buttonObject.permissionsRequired?.length) {
            for (const permission of buttonObject.permissionsRequired) {
                if (!interaction.member.permissions.has(permission)) {
                    interaction.reply({
                        content: 'You do not have sufficient permission to run this command.',
                        ephemeral: true,
                    });
                    return;
                }
            }
        }

        await buttonObject.callback(client, interaction, params);

    } catch (err) {
        console.log(`Error running button: ${err}`);
        await interaction.reply({ content: 'There was an error with that button interaction.', flags: MessageFlags.Ephemeral });
    }
};