"use strict";
const { Client, Interaction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");

module.exports = {

    name: 'open-remove-player-modal',
    description: 'Open a modal to remove a player from the batch',

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @param {Object} params 
     */
    callback: async(client, interaction, params) => {
        const modal = new ModalBuilder()
            .setCustomId('removePlayerModal')
            .setTitle('Remove a Player');
        
        const playerInput = new TextInputBuilder()
            .setCustomId('playerName')
            .setLabel("Enter the player's name to remove")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
        
        const row = new ActionRowBuilder().addComponents(playerInput);
        modal.addComponents(row);

        await interaction.showModal(modal);
    }
};