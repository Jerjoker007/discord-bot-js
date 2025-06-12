"use strict";
const { Interaction, 
    ApplicationCommandOptionType, 
    PermissionFlagsBits, 
    InteractionResponse, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    Client,
    ContainerBuilder,
    EmbedBuilder
} = require('discord.js');
const { encodeCustomId } = require('../../utils/customId');
const { getBotOwnerInfos } = require('../../utils/ownerInfos');

module.exports = {

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {

        const userAvatarUrl = interaction.member.user.avatarURL() ?? interaction.member.user.defaultAvatarURL;
        const embeds = new EmbedBuilder()
            .setColor(15844367)
            .setTitle(`Raviente's Batch ${interaction.options.get('batch').value} Review`)
            .setAuthor({ name: `${interaction.member.user.username}`, icon_url: `${userAvatarUrl}`})
            .addFields(
                {name: `Batch`, value: `Batch ${interaction.options.get('batch')}`},
                {name: `Player List`, }
            )
            .setTimestamp(new Date().toISOString());

        

        await interaction.reply({
            embeds: [embeds],
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