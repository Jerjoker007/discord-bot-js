"use strict";
const { Interaction, ApplicationCommandOptionType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client } = require('discord.js');
const { ownerInfos, submissionTracker } = require('../../state/globalState');
const { getDbData } = require('../../utils/db/getDbData');
module.exports = {
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {

        const reviewChannelId = '1374472832532091071';
        const userAvatarUrl = interaction.member.user.avatarURL() ?? interaction.member.user.defaultAvatarURL;

        const ownerInfo = await ownerInfos.get(client);

        //Select in the database (discord table) the character_id, bounty & gacha to move ahead.
        const dbData = await getDbData(client.db, interaction.member.id);

        if (!dbData || !dbData.char_id) {
            await interaction.reply({
                embeds: [{
                    author: {
                    name: `${interaction.member.user.username}`,
                    icon_url: `${userAvatarUrl}`,
                    },
                    title: "🛑 Error Occured 🛑",
                    description: `You don't seem to be binded correctly`,
                    fields: [
                        {
                            name: `🚧Command Used`,
                            value: "`/ravi-submit`",
                        },
                        {
                            name: '📜Error message',
                            value: ">>> You don't have any account on this server, pease create an account with `/create` or bind existing one with `/bind`",
                        },
                    ],
                    color: 15844367,
                    footer: {
                    text: `You can consult this to ${ ownerInfo.username }`,
                    icon_url: `${ ownerInfo.avatarURL }`
                    },
                    timestamp: new Date().toISOString(),
                 }],
            });

            return;
        }

        //Check if the attachment is an image
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
                            name: `🚧Command Used`,
                            value: "`/ravi-submit`",
                        },
                        {
                            name: '📜Error message',
                            value: `>>> You most likely did not sent an image.`,
                        },
                    ],
                    color: 15844367,
                    footer: {
                    text: `You can consult this to ${ ownerInfo.username }`,
                    icon_url: `${ ownerInfo.avatarURL }`
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
                            name: `🚧Command Used`,
                            value: "`/ravi-submit`",
                        },
                        {
                            name: '📜Error message',
                            value: `>>> You most likely already sent a submission.`,
                        },
                    ],
                    color: 15844367,
                    footer: {
                    text: `You can consult this to ${ ownerInfo.username}7`,
                    icon_url: `${ ownerInfo.avatarURL }`
                    },
                    timestamp: new Date().toISOString(),
                }],
            });
            return;
        }

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
                        value: `${dbData.inGameName}`,
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
        });

        //Send a confirmation to the user
        await interaction.reply({
            content: `Your bounty is submited`,
            files: [
                `${interaction.options.getAttachment('image').url}`
            ]
        });
        
        await submissionTracker.markSubmittedUser(`batch-${interaction.options.get('batch').value}`, interaction.member.id, dbData, sentMessage.channel.id, sentMessage.id);

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
