"use strict";
const path = require('path');
const userDataPath = path.resolve(__dirname, '../../data/submittedUsers.json');
const rewardDataPath = path.resolve(__dirname, '../../data/raviRewards.json');
const submissionTracker = require('../../utils/submissionTracker');
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
            const batchDistribution = new RewardDistributor(userDataPath, rewardDataPath, client.db);
            
            await batchDistribution.loadFiles();
            await batchDistribution.distribute(params.batch);

            let messages = await submissionTracker.fetchMessages(params.batch);

            for (const message of messages) {
                const fetchedMessage = await client.channels.cache.get(message.channelId).messages.fetch(message.messageId);

                const fetchedMessageComponents = fetchedMessage.components.map(row => {
                    return new ActionRowBuilder().addComponents(
                        row.components.map(btn => new ButtonBuilder.from(btn).setDisabled(true))
                    );
                });

                await fetchedMessage.edit({
                    content: '✅ This submission has been accepted.',
                    components: fetchedMessageComponents
                });
            }

            await submissionTracker.unmarkBatch(params.batch);

            const components = interaction.message.components.map(row => {
                return new ActionRowBuilder().addComponents(
                    row.components.map(btn => new ButtonBuilder.from(btn).setDisabled(true))
                );
            });

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