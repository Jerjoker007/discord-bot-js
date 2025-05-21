"use strict";
const { Interaction, ApplicationCommandOptionType, PermissionFlagsBits, InteractionResponse, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } = require('discord.js');
module.exports = {
    /**
     *
     * @param {Client} ravi
     * @param {Interaction} interaction
     */
    callback: async (ravi, interaction) => {

        const confirmChannel = '1374472832532091071';

        await interaction.reply({
            content: 'Your bounty is submited',
            files: [
                `${interaction.options.get('image').attachment.url}`
            ]
        });

        await ravi.channels.cache.get(confirmChannel).send({
            embeds: [{
                author: {
                name: `${interaction.member.user.username}`,
                icon_url: `${interaction.member.user.avatarURL()}`
                },
                title: "Raviente's Bounty Submission",
                description: ``,
                fields: [
                    {
                        name: 'User',
                        value: `<@${interaction.member.id}>`,
                        inline: true,
                    },
                    {
                        name: `Batch`,
                        value: `${interaction.options.get('batch').value}`,
                        inline: true,
                    },
                ],
                image: {
                url: `${interaction.options.get('image').attachment.url}`
                },
                thumbnail: {
                url: `${interaction.guild.members.me.user.avatarURL()}`
                },
                color: "15844367",
                footer: {
                text: `${interaction.guild.members.me.user.username}`,
                icon_url: `${interaction.guild.members.me.user.avatarURL()}`
                },
                timestamp: new Date().toISOString(),
            }],
            components: [
                new ActionRowBuilder().setComponents(
                    new ButtonBuilder()
                        .setCustomId(`confirm|userId:${interaction.member.id}`)
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('reject')
                        .setLabel('Reject')
                        .setStyle(ButtonStyle.Danger)
                ),
            ]
        });
    },

    name: 'ravi-submit',
    description: `Submission for the Raviente's raid event`,
    // devOnly: Boolean,
    // testOnly: Boolean,
    options: [
        {
            name: 'image',
            description: 'Screenshot of phase 4 or 5 to prove yourself.',
            type: ApplicationCommandOptionType.Attachment,
            required: true,
        },
        {
            name: 'batch',
            description: 'Which batch did you participated.',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'Batch 1',
                    value: 'batch-1',
                },
                {
                    name: 'Batch 2',
                    value: 'batch-2',
                },
                {
                    name: 'Batch 3',
                    value: 'batch-3',
                },
                {
                    name: 'Batch 4',
                    value: 'batch-4',
                },
            ],
            required: true,
        },
    ],
};
