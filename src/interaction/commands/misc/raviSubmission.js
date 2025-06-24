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

        await interaction.deferReply();

        const guildConfig = getGuildConfig(interaction.guild.id);
        const userAvatarUrl = interaction.member.user.displayAvatarURL();
        const ownerInfo = await ownerInfos.get(client);
        try {

            const err = validateCommandAccess(interaction, guildConfig.channels?.receptionist, guildConfig);
            if (err) {
                return await interaction.editReply({
                    content: `❌ ${err}`,
                });
            }

            const ownerInfo = await ownerInfos.get(client);
    
            //Select in the database (discord table) the character_id, bounty & gacha to move ahead.
            const dbData = await getDbData(client.db, interaction.member.id);
    
            if (!dbData || !dbData.char_id) {
                await interaction.editReply({
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
                
                await interaction.editReply({
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
                await interaction.editReply({
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
    
            const attachment = interaction.options.getAttachment('image');
            //Send an interaction to the moderation team
            const sentMessage = await client.channels.cache.get(guildConfig.channels.review).send({
                embeds: [new EmbedBuilder()
                                .setAuthor({name: interaction.member.user.username, iconURL: userAvatarUrl})
                                .setTitle(`Raviente's Bounty Submission`)
                                .addFields([
                                    {
                                        name: 'User',
                                        value: `<@${interaction.member.id}>`,
                                        inline: true,
                                    },
                                    {
                                        name: 'In-game Name',
                                        value: dbData.inGameName,
                                        inline: true,
                                    },
                                    {
                                        name: `Batch`,
                                        value: `Batch ${interaction.options.get('batch').value}`,
                                        inline: true,
                                    },
                                ])
                                .setImage(`attachment://${attachment.name}`)
                                .setColor(0x94fc03)
                                .setTimestamp()
                        ],
                files: [attachment],
            });
    
            //Send a confirmation to the user
            await interaction.editReply({
                content: `Your bounty in **Batch ${interaction.options.get('batch').value}** is submitted`,
                files: [attachment]
            });
            
            await submissionManager.markSubmittedUser(`batch-${interaction.options.get('batch').value}`, interaction.member.id, dbData, sentMessage.channel.id, sentMessage.id);
            
        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                .setAuthor({name: interaction.member.user.username, iconURL: userAvatarUrl})
                .setThumbnail(client.user.displayAvatarURL())
                .setTitle(`🛑 Error Occurred 🛑`)
                .setDescription(`Some error can't be handled`)
                .addFields([
                    {
                        name: `🚧Command Used`,
                        value: "`/ravi-submit`",
                    },
                    {
                        name: '📜Error message',
                        value: `>>> Error code: ${err.code ?? 'N/A'}\nError message: ${err.message ?? 'No message provided'}`,
                    },
                    {
                        name: `⛑ Author's advice`,
                        value: "```Error is written by the bot itself, please read the message carefully and contact```",
                    },
                ])
                .setColor(0x94fc03)
                .setFooter({ text: `You can consult this to ${ ownerInfo.username }`, iconURL: ownerInfo.avatarURL })
                .setTimestamp();

            await client.channels.cache.get(guildConfig.channels.errors).send({
                embeds: [errorEmbeds],
            });
            if (interaction.deferred && !interaction.replied) {
                await interaction.editReply({
                    embeds:[errorEmbeds]
                });
            } else if (!interaction.replied) {
                await interaction.reply({
                    embeds: [errorEmbeds]
                });
            } else {
                await interaction.followUp({
                    embeds: [errorEmbeds]
                });
            }
        }
    },

    name: 'ravi-submit',
    description: `Submission for the Raviente's raid event`,
    testing: true,
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
