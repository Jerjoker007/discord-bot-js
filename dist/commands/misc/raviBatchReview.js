"use strict";
const { Interaction, ApplicationCommandOptionType, PermissionFlagsBits, InteractionResponse, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } = require('discord.js');
const { encodeCustomId } = require('../../utils/customId');
const { getBotOwnerInfos } = require('../../utils/ownerInfos');

module.exports = {

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {

        const confirmChannel = '1374472832532091071';
        const userAvatarUrl = interaction.member.user.avatarURL() ?? interaction.member.user.defaultAvatarURL;

        await interaction.reply({
            embeds: [{
                author: {
                name: `${interaction.member.user.username}`,
                icon_url: `${userAvatarUrl}`,
                },
                title: `Raviente's Batch ${interaction.options.get('batch').value} Review`,
                description: ``,
                fields: [
                    {
                        name: `Batch`,
                        value: `Batch ${interaction.options.get('batch').value}`,
                        inline: true,
                    },
                ],
                color: 15844367,
                timestamp: new Date().toISOString(),
            }],
            components: [
                new ActionRowBuilder().setComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `${encodeCustomId(
                                'ravi',
                                'batch-confirm',
                                {
                                    batch: `batch-${interaction.options.get('batch').value}`,
                                }
                            )}`
                        )
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Success),
                    
                    new ButtonBuilder()
                        .setCustomId(
                            `${encodeCustomId(
                                'ravi',
                                'batch-reject',
                                {
                                    batch: `batch-${interaction.options.get('batch').value}`,
                                }
                            )}`
                        )
                        .setLabel('Reject')
                        .setStyle(ButtonStyle.Danger)
                ),
            ]
        });
    },

    name: 'ravi-batch-review',
    description: `Review a batch's submission`,
    // devOnly: Boolean,
    // testOnly: Boolean,
    options: [
        {
            name: 'batch',
            description: 'Which batch do you want to review.',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'Batch 1',
                    value: '1',
                },
                {
                    name: 'Batch 2',
                    value: '2',
                },
                {
                    name: 'Batch 3',
                    value: '3',
                },
                {
                    name: 'Batch 4',
                    value: '4',
                },
            ],
            required: true,
        },
    ],
}