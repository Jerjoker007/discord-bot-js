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
        const batchReviewer = batchManager.fetchBatch(params.batch);

        batchReviewer.nextPage();

        await interaction.update({
            embeds: [batchReviewer.generateEmbed()],
            components: batchReviewer.buildComponents()
        });

        batchManager.saveState();
    }
};