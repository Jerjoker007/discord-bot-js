"use strict";
const { Interaction, ApplicationCommandOptionType, Client, EmbedBuilder, MessageFlags } = require('discord.js');
const { batchManager, submissionManager } = require('../../../state/globalState');
const BatchReviewer = require('../../../utils/class/BatchReviewer');
const { validateCommandAccess } = require('../../../utils/commandAccess');
const { getGuildConfig } = require('../../../utils/configManager');
const { ownerInfos } = require('../../../state/globalState');

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
    
            const err = validateCommandAccess(interaction, guildConfig.channels?.review, guildConfig);
            if (err) {
                return await interaction.editReply({
                    content: `❌ ${err}`,
                    flags: MessageFlags.Ephemeral
                });
            }
    
            const batchKey = `batch-${interaction.options.get('batch').value}`;
    
            if (await batchManager.fetchBatch(batchKey)) {
                return interaction.editReply({
                    content: `⚠️ This batch is already being reviewed.`,
                    flags: MessageFlags.Ephemeral
                });
            }
    
            const players = await submissionManager.fetchBatch(batchKey);
    
            if (Object.keys(players).length < 1) {
                return interaction.editReply({
                    content: `❌ This batch is empty and cannot be reviewed.`,
                    flags: MessageFlags.Ephemeral
                });
            }
    
            const interactionUser = {
                id: `${interaction.member.id}`,
                username: `${interaction.member.user.username}`,
                avatarURL: `${interaction.member.user.avatarURL() ?? interaction.member.user.defaultAvatarURL}`
            };
    
            const batchReviewerInstance = new BatchReviewer(batchKey, interactionUser);
            await batchReviewerInstance.loadFile();
            
            await interaction.editReply({
                embeds: [batchReviewerInstance.generateEmbed()],
                components: batchReviewerInstance.buildComponents(),
            });
    
            await batchManager.addBatch(batchKey, batchReviewerInstance);
        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                .setAuthor({name: interaction.member.user.username, iconURL: userAvatarUrl })
                .setThumbnail(client.user.displayAvatarURL())
                .setTitle(`🛑 Error Occurred 🛑`)
                .setDescription(`Some error can't be handled`)
                .addFields([
                    {
                        name: `🚧Command Used`,
                        value: "`/ravi-batch-review`",
                    },
                    {
                        name: '📜Error message',
                        value: `>>> Error code: ${err.code ?? 'N/A'}\nError message: ${err.message ?? 'No message provided'}`,
                    },
                    {
                        name: `⛑ Author's advice`,
                        value: "```Error is written by the bot itself, please read the message carefully and contact the bot's owner```",
                    },
                ])
                .setColor(0x94fc03)
                .setFooter({ text: `You can consult this to ${ ownerInfo.username }`, iconURL:  ownerInfo.avatarURL })
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

    name: 'ravi-batch-review',
    description: `Review a batch's submission`,
    devOnly: true,
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