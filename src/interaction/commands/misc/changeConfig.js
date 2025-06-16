"use strict" ;
const { Client, Interaction, ApplicationCommandOptionType, MessageFlags, PermissionFlagsBits } = require("discord.js");
const fs = require('fs');
const { updateGuildConfig } = require('../../../utils/guildConfig');

module.exports = {

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const subCommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        const type = interaction.options.getString('type');
        const channel = interaction.options.getChannel('channel')

        updateGuildConfig(guildId, (cfg) => {
            cfg.channels[type] = channel.id;
        });

        await interaction.reply({
            content: `✅ Channel for **${type}** set to <#${channel.id}>.`,
            flags: MessageFlags.Ephemeral
        });
    },

    name: 'ravi-config',
    description: `Configure server settings.`,
    options: [
        {
            name: 'channel',
            description: 'Set up bot channels',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'type',
                    description: 'Type of channel to configure.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: 'Receptionnist', value: 'receptionist'},
                        { name: 'Review', value: 'review'},
                        { name: 'Errors', value: 'errors'},
                    ]
                },
                {
                    name: 'channel',
                    description: 'The channel to assign.',
                    type: ApplicationCommandOptionType.Channel,
                    required: true
                }
            ]
        }
    ]

};