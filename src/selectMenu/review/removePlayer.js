"use strict" ;
const { Client, Interaction, MessageFlags } = require('discord.js');
const { submissionManager, batchManager} = require('../../state/globalState');
const BatchReviewer = require('../../utils/class/BatchReviewer');
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
            const batchReviewerInstance = batchManager.fetchBatch(params.batch);
            await batchReviewerInstance.loadFile();

            batchReviewerInstance.removePlayerById(interaction.values[0]);
            submissionManager.unmarkSubmittedUser(interaction.values[0], params.batch);

            if (!batchReviewerInstance.getAllPlayers().length) {
                
                await interaction.deferUpdate();
                await interaction.message.delete();

                await interaction.followUp({
                    content: 'The batch is now empty and has been removed.',
                    flags: MessageFlags.Ephemeral
                });

                batchManager.deleteBatch(params.batch);
                
                submissionManager.unmarkBatch(params.batch);

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