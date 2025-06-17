"use strict" ;
const { Client, Interaction, MessageFlags } = require('discord.js');
const { submissionManager, batchManager} = require('../../../state/globalState');
const BatchReviewer = require('../../../utils/class/BatchReviewer');
const { getGuildConfig } = require('../../../utils/guildConfig');
module.exports = {

    name: 'remove-player',
    description: 'Remove a player from a batch.',

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @param {Object} params 
     */
    callback: async (client, interaction, params) => {
        try {
            const guildInfo = getGuildConfig(interaction.guild.id);
            const batchReviewerInstance = await batchManager.fetchBatch(params.batchKey);
            await batchReviewerInstance.loadFile();

            const message = await submissionManager.fetchUserMessage(interaction.values[0], params.batchKey);
            if (message) {
                try {
                    const fetchedMessage = await client.channels.cache.get(message.channelId).messages.fetch(message.messageId);
                    
                    await fetchedMessage.edit({
                        content: `❌ This submission has been rejected.`,
                    });
                    
                } catch (err) {
                    if (err.code === 10008) {
                        console.warn(`Message ${message.messageId} in channel ${message.channelId} was not found. Skipping.`);
                    } else {
                        console.error(`Error updating message ${message.messageId}:`, err);
                    }
                }
            }

            batchReviewerInstance.removePlayerById(interaction.values[0]);
            submissionManager.unmarkSubmittedUser(interaction.values[0], params.batchKey);

            await client.channels.cache.get(guildInfo.channels.receptionist).send({
                content: `<@${interaction.values[0]}> your submission was rejected by ${interaction.user.username}.`,
            });

            if (!batchReviewerInstance.getAllPlayers().length) {
                
                await interaction.deferUpdate();
                await interaction.message.delete();

                await interaction.followUp({
                    content: 'The batch is now empty and has been removed.',
                    flags: MessageFlags.Ephemeral
                });

                await batchManager.deleteBatch(params.batchKey);
                
                await submissionManager.unmarkBatch(params.batchKey);

                return;
            }

            await interaction.update({
                embeds: [batchReviewerInstance.generateEmbed()],
                components: batchReviewerInstance.buildComponents()
            });

        } catch (err) {
            console.log(`Error running remove player: ${err}`);
        }
    }
}