"use strict";
const { Interaction, ApplicationCommandOptionType, PermissionFlagsBits, InteractionResponse, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } = require('discord.js');
const { encodeCustomId } = require('../../utils/customId');
const submissionTracker = require('../../utils/submissionTracker');
module.exports = {
    /**
     *
     * @param {Client} ravi
     * @param {Interaction} interaction
     */
    callback: async (ravi, interaction) => {

        const confirmChannel = '1374472832532091071';
        const userAvatarUrl = interaction.member.user.avatarURL() ?? interaction.member.user.defaultAvatarURL;

        await interaction.client.application.fetch();

        let ownerAvatarUrl;
        const owner = interaction.client.application.owner;

        ownerAvatarUrl = owner.displayAvatarURL({ dynamic: true });

        //Check if the user already submitted a bounty
        if (submissionTracker.hasSubmitted(interaction.member.id)) {
            await interaction.reply({
                embeds: [{
                    author: {
                    name: `${interaction.member.user.username}`,
                    icon_url: `${userAvatarUrl}`,
                    },
                    title: "🛑 Error Occured 🛑",
                    description: `You have already submitted a bounty`,
                    fields: [
                        {
                            name: `Command`,
                            value: `ravi-submit`,
                        },
                        {
                            name: 'Error message',
                            value: `<@${interaction.member.id}> has most likely already sent a submission.`,
                        },
                    ],
                    color: "15844367",
                    footer: {
                    text: `You can consult this to jerjoker007`,
                    icon_url: `${ownerAvatarUrl}`
                    },
                    timestamp: new Date().toISOString(),
                }],
            });
            return;
        }

        //Send an interaction to the validation team
        await ravi.channels.cache.get(confirmChannel).send({
            embeds: [{
                author: {
                name: `${interaction.member.user.username}`,
                icon_url: `${userAvatarUrl}`,
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
                        .setCustomId(
                            `${encodeCustomId(
                                'ravi',
                                'confirm',
                                {
                                    userId: `${interaction.member.id}`,
                                    batch: `${interaction.options.get('batch').value}`,
                                }
                            )}`
                        )
                        .setLabel('Confirm')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(
                            `${encodeCustomId(
                                'ravi',
                                'reject',
                                {
                                    userId: `${interaction.member.id}`,
                                    batch: `${interaction.options.get('batch').value}`,
                                }
                            )}`)
                        .setLabel('Reject')
                        .setStyle(ButtonStyle.Danger)
                ),
            ]
        });

        //Send a confirmation to the user
        await interaction.reply({
            content: 'Your bounty is submited',
            files: [
                `${interaction.options.get('image').attachment.url}`
            ]
        });
        
        //Save the users id to block future submission if not accepted
        await submissionTracker.markSubmitted(interaction.member.id);
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
                    value: 'Batch 1',
                },
                {
                    name: 'Batch 2',
                    value: 'Batch2',
                },
                {
                    name: 'Batch 3',
                    value: 'Batch 3',
                },
                {
                    name: 'Batch 4',
                    value: 'Batch 4',
                },
            ],
            required: true,
        },
    ],
};
