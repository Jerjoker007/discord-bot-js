"use strict";
const { Interaction, ApplicationCommandOptionType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, MessageFlags } = require('discord.js');
const { ownerInfos, submissionManager } = require('../../../state/globalState');
const { getDbData } = require('../../../utils/db/getDbData');
const { getGuildConfig } = require('../../../utils/guildConfig');
const { validateCommandAccess } = require('../../../utils/commandAccess');
module.exports = {
    /**
     *
     * @param {Client} client
     * @param {Interaction} interaction
     */
    callback: async (client, interaction) => {
        const guildConfig = getGuildConfig(interaction.guild.id);
        const reviewChannelId = guildConfig.channels?.review;
        const submissionChannelId = guildConfig.channels?.receptionist;

        const err = validateCommandAccess(interaction, submissionChannelId, guildConfig);
        if (err) {
            return await interaction.reply({
                content: `❌ ${err}`,
                flags: MessageFlags.Ephemeral
            });
        }

        const userAvatarUrl = interaction.member.user.avatarURL() ?? interaction.member.user.defaultAvatarURL;

        const ownerInfo = await ownerInfos.get(client);

        //Select in the database (discord table) the character_id, bounty & gacha to move ahead.
        const dbData = await getDbData(client.db, interaction.member.id);

        if (!dbData || !dbData.char_id) {
            await interaction.reply({
                embeds: [new EmbedBuilder()
                            .setAuthor({name: `${interaction.member.user.username}`, iconURL: `${userAvatarUrl}`})
                            .setTitle(`🛑 Error Occured 🛑`)
                            .setDescription(`You don't seem to be binded correctly`)
                            .addFields([
                                {
                                    name: `🚧Command Used`,
                                    value: "`/ravi-submit`",
                                },
                                {
                                    name: '📜Error message',
                                    value: ">>> You don't seem to be correctly binded or haven't selected a main character, use `/card` and follow the error's instruction.\nOnce done come back and resubmit.",
                                },
                            ])
                            .setColor(15844367)
                            .setFooter({ text: `You can consult this to ${ ownerInfo.username }`, iconURL: `${ ownerInfo.avatarURL }`})
                            .setTimestamp()
                    ],
            });

            return;
        }

        //Check if the attachment is an image
        if (!interaction.options.getAttachment('image').contentType?.startsWith('image/')) {
            
            await interaction.reply({
                embeds: [new EmbedBuilder()
                            .setAuthor({name: `${interaction.member.user.username}`, iconURL: `${userAvatarUrl}`})
                            .setTitle(`🛑 Error Occured 🛑`)
                            .setDescription(`You need to send an image`)
                            .addFields([
                                {
                                    name: `🚧Command Used`,
                                    value: "`/ravi-submit`",
                                },
                                {
                                    name: '📜Error message',
                                    value: ">>> You most likely did not sent an image.",
                                },
                            ])
                            .setColor(15844367)
                            .setFooter({ text: `You can consult this to ${ ownerInfo.username }`, iconURL: `${ ownerInfo.avatarURL }`})
                            .setTimestamp()
                        ],
            });

            return;
        }
        
        //Check if the user already submitted a bounty
        if (await submissionManager.hasUserSubmitted(interaction.member.id)) {
            await interaction.reply({
                embeds: [new EmbedBuilder()
                            .setAuthor({name: `${interaction.member.user.username}`, iconURL: `${userAvatarUrl}`})
                            .setTitle(`🛑 Error Occured 🛑`)
                            .setDescription(`You have already submitted a bounty`)
                            .addFields([
                                {
                                    name: `🚧Command Used`,
                                    value: "`/ravi-submit`",
                                },
                                {
                                    name: '📜Error message',
                                    value: ">>> You most likely already sent a submission.",
                                },
                            ])
                            .setColor(15844367)
                            .setFooter({ text: `You can consult this to ${ ownerInfo.username }`, iconURL: `${ ownerInfo.avatarURL }`})
                            .setTimestamp()
                        ],
            });
            return;
        }

        //Send an interaction to the moderation team
        const sentMessage = await client.channels.cache.get(reviewChannelId).send({
            embeds: [new EmbedBuilder()
                            .setAuthor({name: `${interaction.member.user.username}`, iconURL: `${userAvatarUrl}`})
                            .setTitle(`Raviente's Bounty Submission`)
                            .addFields([
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
                            ])
                            .setImage(interaction.options.getAttachment('image').url)
                            .setColor(15844367)
                            .setTimestamp()
                    ],
        });

        //Send a confirmation to the user
        await interaction.reply({
            content: `Your bounty is submited`,
            files: [
                `${interaction.options.getAttachment('image').url}`
            ]
        });
        
        await submissionManager.markSubmittedUser(`batch-${interaction.options.get('batch').value}`, interaction.member.id, dbData, sentMessage.channel.id, sentMessage.id);

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
