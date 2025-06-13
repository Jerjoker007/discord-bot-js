"use strict";
const path = require('path');
const rewardDataPath = path.resolve(__dirname, '../../data/raviRewards.json');
const { submissionTracker } = require('../../state/globalState');
const RewardDistributor = require('../../utils/class/RewardDistributor');
const { Client, Interaction, ActionRowBuilder, ButtonBuilder, MessageFlags } = require('discord.js');

module.exports = {

    name: 'batch-confirm',
    description: 'Confirm the batch and distribute rewards',

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @param {Object} params 
     */
    callback: async (client, interaction, params) => {
        try {
            const batchDistribution = new RewardDistributor(rewardDataPath, params.batch, client.db);
            
            await batchDistribution.loadFiles();
            await batchDistribution.distribute();

            let messages = await submissionTracker.fetchMessages(params.batch);

            for (const message of messages) {
                try {
                    const fetchedMessage = await client.channels.cache.get(message.channelId).messages.fetch(message.messageId);

                    await fetchedMessage.edit({
                        content: '✅ This submission has been accepted.',
                        components: []
                    });
                } catch (err) {
                    if (err.code === 10008) {
                        console.warn(`Message ${message.messageId} in channel ${message.channelId} was not found. Skipping.`);
                    } else {
                        console.error(`Error updating message ${message.messageId}:`, err);
                    }
                }
            }

            await submissionTracker.unmarkBatch(params.batch);

            const components = interaction.message.components.map(row => {
                // Filter only buttons and disable them
                const buttons = row.components
                    .filter(comp => comp.data?.type === 2) // 2 = button
                    .map(btn => ButtonBuilder.from(btn).setDisabled(true));

                // If the row has any buttons, return it
                return buttons.length > 0 ? new ActionRowBuilder().addComponents(buttons) : null;
            }).filter(row => row !== null);

            await interaction.update({
                content: '✅ This batch has been accepted.',
                components
            });

        } catch (err) {
            console.log(`Error running Button: ${err}`);
            await interaction.reply({ content: 'There was an error with that button interaction.', flags: MessageFlags.Ephemeral });
        }
    },

}