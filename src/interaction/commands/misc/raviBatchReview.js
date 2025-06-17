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
    EmbedBuilder,
    MessageFlags
} = require('discord.js');
const { batchManager, submissionManager } = require('../../../state/globalState');
const BatchReviewer = require('../../../utils/class/BatchReviewer');
const { validateCommandAccess } = require('../../../utils/commandAccess');

module.exports = {

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        try { 
            const guildConfig = getGuildConfig(interaction.guild.id);
            const reviewChannelId = guildConfig.channels?.review;
    
            const err = validateCommandAccess(interaction, reviewChannelId, guildConfig);
            if (err) {
                return await interaction.reply({
                    content: `❌ ${err}`,
                    flags: MessageFlags.Ephemeral
                });
            }
    
            const batchKey = `batch-${interaction.options.get('batch').value}`;
    
            if (batchManager.fetchBatch(batchKey)) {
                return interaction.reply({
                    content: `⚠️ This batch is already being reviewed.`,
                    flags: MessageFlags.Ephemeral
                });
            }
    
            const players = await submissionManager.fetchBatch(batchKey);
    
            if (Object.keys(players).length < 1) {
                return interaction.reply({
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
            
            await interaction.reply({
                embeds: [batchReviewerInstance.generateEmbed()],
                components: batchReviewerInstance.buildComponents()
            });
    
            batchManager.addBatch(batchKey, batchReviewerInstance);
        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                .setAuthor({name: `${interaction.member.user.username}`, iconURL: `${userAvatarUrl}`})
                .setTitle(`🛑 Error Occured 🛑`)
                .setDescription(`Some error can't be handled`)
                .addFields([
                    {
                        name: `🚧Command Used`,
                        value: "`/ravi-batch-review`",
                    },
                    {
                        name: '📜Error message',
                        value: `>>> Error code:${err.code}\nError message:${err.message}`,
                    },
                ])
                .setColor(15844367)
                .setFooter({ text: `You can consult this to ${ ownerInfo.username }`, iconURL: `${ ownerInfo.avatarURL }`})
                .setTimestamp();
            await interaction.reply({
                embeds: [errorEmbeds],
            });
            await client.channels.cache.get(guildConfig.channels.errors).send({
                embeds: [errorEmbeds],
            });
        }
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