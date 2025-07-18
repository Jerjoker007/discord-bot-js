const path = require('path');
const { editLimiter, sendLimiter } = require('../../../utils/globalLimiter');
const rewardDataPath = path.join(__dirname, '../../../data/review/raviRewards.json');
const { submissionManager } = require('../../../state/globalState');
const { Client, Interaction, ActionRowBuilder, ButtonBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const RewardDistributor = require('../../../utils/class/RewardDistributor');
const { getGuildConfig } = require('../../../utils/configManager');
const { ownerInfos } = require('../../../state/globalState');

module.exports = {

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async(client, interaction, params) => {
        const start = Date.now();

        await interaction.deferUpdate();

        const guildConfig = getGuildConfig(interaction.guild.id);
        const userAvatarUrl = interaction.member.user.displayAvatarURL();
        const ownerInfo = await ownerInfos.get(client);
        try {

            const components = interaction.message.components.map(row => {
                return new ActionRowBuilder().addComponents(
                    row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                )
            });

            await interaction.message.edit({
                content: '🔄 Working on it, please wait...',
                components
            });

            const batchDistribution = new RewardDistributor(rewardDataPath, params.batchKey, interaction, client.db);
            await batchDistribution.loadFiles();

            const dbStart = Date.now();
            await batchDistribution.distribute();
            const dbEnd = Date.now();

            await interaction.message.edit({
                content: '🔄 Distribution done — handling messages now. This may take a few minutes, please wait…',
                components
            });
            
            const distributionMessages = await batchDistribution.createBountyMessage();
            const submissionMessages = await submissionManager.fetchBatchMessages(params.batchKey);

            const editTasks = submissionMessages.map(async (message) => {
                try {
                    const channel = client.channels.cache.get(message.channelId);
                    const fetchedMessage = await channel.messages.fetch(message.messageId);
            
                    await editLimiter.schedule(() =>
                        fetchedMessage.edit({
                            content: `✅ This submission's reward has been distributed.`,
                            components: []
                        })
                    );

                } catch (err) {
                    if (err.code === 10008) {
                        console.warn(`Message ${message.messageId} in channel ${message.channelId} was not found. Skipping.`);
                    } else {
                        console.error(`Error updating message ${message.messageId}:`, err);
                    }
                }
            });
            const sendTasks = distributionMessages.map(async (message) => {
                await sendLimiter.schedule(() =>
                    client.channels.cache.get(guildConfig.channels.receptionist).send(message)
                );
            });

            await Promise.all([...editTasks, ...sendTasks]);

            await interaction.message.delete().catch(() => {});

            const end = Date.now();
            const entireDuration = end - start;
            const dbDuration = dbEnd - dbStart;

            await interaction.followUp({
                content: `✅ Distribution complete (Full command: ${entireDuration}ms, Distribution only: ${dbDuration}ms).`,
                flags: MessageFlags.Ephemeral
            });
            
            await submissionManager.unmarkBatch(params.batchKey);
            
        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                            .setAuthor({name: interaction.member.user.username, iconURL: userAvatarUrl})
                            .setThumbnail(client.user.displayAvatarURL())
                            .setTitle(`🛑 Error Occurred 🛑`)
                            .setDescription(`Some error can't be handled`)
                            .addFields([
                                {
                                    name: `🚧Button Used`,
                                    value: "`batch-distribution`",
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
                            .setFooter({ text: `You can consult this to ${ ownerInfo.username }`, iconURL: ownerInfo.avatarURL })
                            .setTimestamp();
            
            await client.channels.cache.get(guildConfig.channels.errors).send({
                embeds: [errorEmbeds],
            });
            
            await interaction.message.edit({
                content: '🛑 Error Occured, check with moderators 🛑',
                embeds: [errorEmbeds],
                components: [] // Disable buttons to prevent further interactions if relevant
            });
        }
    },

    name: "batch-distribution",
    description: "Distribute the rewards for the batch"
}