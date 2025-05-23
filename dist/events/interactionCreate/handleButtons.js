"use strict";
const { Client, Interaction, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { devs } = require('../../../config.json');
const { decodeCustomId } = require('../../utils/customId');
const submissionTracker = require('../../utils/submissionTracker');
/**
 * 
 * @param {Client} ravi 
 * @param {Interaction} interaction 
 */
module.exports = async (ravi, interaction) => {
    if (!interaction.isButton()) return;

    const submitChannel = '1374042127121518785';
    const { botName, action, params} = decodeCustomId(interaction.customId);

    if (botName === 'ravi') {
        if (action === 'confirm') {

            if (params.userId === interaction.member.id) {
                interaction.reply({
                    content: 'You cannot authorize your own submission.',
                    flags: MessageFlags.Ephemeral,
                });
            } else {
                const components = interaction.message.components.map(row => {
                    return new ActionRowBuilder().addComponents(
                        row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                    );
                });

                await interaction.update({ 
                    content: '✅ This submission has been accepted.',
                    components 
                });

                await ravi.channels.cache.get(submitChannel).send(`<@${params.userId}> Your submission was accepted by ${interaction.member.user.username} and the rewards has been sent.`);

                await submissionTracker.unmarkSubmitted(params.userId);
            }
        } else if (action === 'reject') {

            const components = interaction.message.components.map(row => {
                return new ActionRowBuilder().addComponents(
                    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                );
            });

            await interaction.update({ 
                content: '❌ This submission has been rejected.',
                components 
            });

            await ravi.channels.cache.get(submitChannel).send(`<@${params.userId}> Your submission was rejected by ${interaction.member.user.username}.`);

            await submissionTracker.unmarkSubmitted(params.userId);
        }
    }
};