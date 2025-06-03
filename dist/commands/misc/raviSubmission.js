"use strict";
const { Interaction, ApplicationCommandOptionType, PermissionFlagsBits, InteractionResponse, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } = require('discord.js');
const { encodeCustomId } = require('../../utils/customId');
const { getBotOwnerInfos } = require('../../utils/ownerInfos');
const submissionTracker = require('../../utils/submissionTracker');
const { channel } = require('diagnostics_channel');
module.exports = {
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {

        const reviewChannelId = '1374472832532091071';
        const userAvatarUrl = interaction.member.user.avatarURL() ?? interaction.member.user.defaultAvatarURL;

        const ownerInfos = await getBotOwnerInfos(client);

        if (!interaction.options.getAttachment('image').contentType?.startsWith('image/')) {
            
            await interaction.reply({
                embeds: [{
                    author: {
                    name: `${interaction.member.user.username}`,
                    icon_url: `${userAvatarUrl}`,
                    },
                    title: "🛑 Error Occured 🛑",
                    description: `You need to send an image`,
                    fields: [
                        {
                            name: `Command`,
                            value: `ravi-submit`,
                        },
                        {
                            name: 'Error message',
                            value: `<@${interaction.member.id}> has most likely not sent an image.`,
                        },
                    ],
                    color: 15844367,
                    footer: {
                    text: `You can consult this to ${ ownerInfos.username}7`,
                    icon_url: `${ ownerInfos.avatarURL }`
                    },
                    timestamp: new Date().toISOString(),
                 }],
            });

            return;
        }
        
        //Check if the user already submitted a bounty
        if (await submissionTracker.hasUserSubmitted(interaction.member.id)) {
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
                    color: 15844367,
                    footer: {
                    text: `You can consult this to ${ ownerInfos.username}7`,
                    icon_url: `${ ownerInfos.avatarURL }`
                    },
                    timestamp: new Date().toISOString(),
                }],
            });
            return;
        }

        //Select in the database (discord table) the character_id, bounty & gacha to move ahead.
        const discordData = {
            char_id: 42626,
            bounty: 0,
            gacha: 0,
            bcMultiplier: 1.00
        };
        //Select in the database (character table) the in-game name to go ahead.
        const inGameName = 'Artemis';

        //Send an interaction to the moderation team
        const sentMessage = await client.channels.cache.get(reviewChannelId).send({
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
                        name: 'In-game Name',
                        value: `${inGameName}`,
                        inline: true,
                    },
                    {
                        name: `Batch`,
                        value: `Batch ${interaction.options.get('batch').value}`,
                        inline: true,
                    },
                ],
                image: {
                url: `${interaction.options.get('image').attachment.url}`
                },
                color: 15844367,
                timestamp: new Date().toISOString(),
            }],
            components: [
                new ActionRowBuilder().setComponents(
                    new ButtonBuilder()
                        .setCustomId(
                            `${encodeCustomId(
                                'ravi',
                                'submission-reject',
                                {
                                    userId: `${interaction.member.id}`,
                                    batch: `batch-${interaction.options.get('batch').value}`,
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
        await submissionTracker.markSubmittedUser(`batch-${interaction.options.get('batch').value}`, interaction.member.id, discordData, inGameName, sentMessage.channel.id, sentMessage.id);

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
};
