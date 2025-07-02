"use strict" ;
const { Client, Interaction, MessageFlags, EmbedBuilder } = require('discord.js');
const { submissionManager, batchManager, ownerInfos} = require('../../../state/globalState');
const { getGuildConfig } = require('../../../utils/configManager');
module.exports = {

    name: 'remove-player',
    description: 'Remove a player from a batch.',

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @param {Object} params 
     */
    callback: async (client, interaction, params) => {
        await interaction.deferUpdate();

        const guildConfig = getGuildConfig(interaction.guild.id);
        const userAvatarUrl = interaction.member.user.displayAvatarURL();
        const ownerInfo = await ownerInfos.get(client);
        try {

            const batchReviewerInstance = await batchManager.fetchBatch(params.batchKey);
            await batchReviewerInstance.loadFile();

            const message = await submissionManager.fetchUserMessage(interaction.values[0], params.batchKey);
            if (message) {
                try {
                    const fetchedMessage = await client.channels.cache.get(message.channelId).messages.fetch(message.messageId);
                    
                    await fetchedMessage.edit({
                        content: `❌ This submission has been rejected.`,
                    });
                    
                } catch (err) {
                    if (err.code === 10008) {
                        console.warn(`Message ${message.messageId} in channel ${message.channelId} was not found. Skipping.`);
                    } else {
                        console.error(`Error updating message ${message.messageId}:`, err);
                    }
                }
            }

            batchReviewerInstance.removePlayerById(interaction.values[0]);
            submissionManager.unmarkSubmittedUser(interaction.values[0], params.batchKey);

            await client.channels.cache.get(guildConfig.channels.receptionist).send({
                content: `<@${interaction.values[0]}> your submission was rejected by ${interaction.user.username}.`,
            });

            if (!batchReviewerInstance.getAllPlayers().length) {
                
                await interaction.message.delete().catch(() => {});

                await interaction.webhook.send({
                    content: 'The batch is now empty and has been removed.',
                    flags: MessageFlags.Ephemeral
                });

                await batchManager.deleteBatch(params.batchKey);
                
                await submissionManager.unmarkBatch(params.batchKey);

                return;
            }

            await interaction.message.edit({
                embeds: [batchReviewerInstance.generateEmbed()],
                components: batchReviewerInstance.buildComponents()
            });

        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                            .setAuthor({name: interaction.member.user.username, iconURL: userAvatarUrl })
                            .setThumbnail(client.user.displayAvatarURL())
                            .setTitle(`🛑 Error Occurred 🛑`)
                            .setDescription(`Some error can't be handled`)
                            .addFields([
                                {
                                    name: `🚧Select Menu Used`,
                                    value: "`remove-player`",
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
            
            await interaction.channel.send({
                embeds: [errorEmbeds],
            });
        }
    }
}