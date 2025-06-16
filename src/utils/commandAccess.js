"use strict";
const { Interaction } = require('discord.js');
module.exports = {
    /**
     * Validate if the user can run the command in this interaction:
     * - Check required channels set in config
     * - Check if interaction happens in allowed channel
     * @param {Interaction} interaction 
     * @param {Object} config 
     */
    validateCommandAccess(interaction, allowedChannel, config) {
        const reviewChannelId = config.channels?.review;
        const submissionChannelId = config.channels?.receptionnist;

        if (!reviewChannelId || !submissionChannelId) {
            return  ' Configuration is not complete (review/receptionist channel is not set up).';     
        }
        if (interaction.channel.id !== allowedChannel) {
            return ` You cannot use this command in this channel (it can only be run in <#${allowedChannel}>).`;
        }
        return null;
    }
}