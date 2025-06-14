"use strict";
const { Client, Interaction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { batchManager } = require('../../state/globalState');

module.exports = {

    name: 'next-page',
    description: 'Change the page on raviBatchReview command',

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @param {Object} params 
     */
    callback: async(client, interaction, params) => {
        const batchReviewerInstance = batchManager.fetchBatch(params.batch);
        await batchReviewerInstance.loadFile();

        batchReviewerInstance.nextPage();

        await interaction.update({
            embeds: [batchReviewerInstance.generateEmbed()],
            components: batchReviewerInstance.buildComponents()
        });

        batchManager.saveState();
    }
};