"use strict";
const path = require('path');
const rewardDataPath = path.join(__dirname, '../../../data/review/raviRewards.json');
const { submissionManager, batchManager } = require('../../../state/globalState');
const RewardDistributor = require('../../../utils/class/RewardDistributor');
const { getGuildConfig } = require('../../../utils/guildConfig');
const { ownerInfos } = require('../../../state/globalState');
const { Client, Interaction, ActionRowBuilder, ButtonBuilder, MessageFlags, EmbedBuilder } = require('discord.js');

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {

    name: 'batch-confirm',
    description: 'Confirm the batch and distribute rewards',

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @param {Object} params 
     */
    callback: async (client, interaction, params) => {
        const guildConfig = getGuildConfig(interaction.guild.id);
        const userAvatarUrl = interaction.member.user.displayAvatarURL();
        const ownerInfo = await ownerInfos.get(client);
        try {
            const batchDistribution = new RewardDistributor(rewardDataPath, params.batchKey, interaction, client.db);
            
            await batchDistribution.loadFiles();
            const dsitributionMessages = await batchDistribution.distribute();

            const messages = await submissionManager.fetchBatchMessages(params.batchKey);

            for (const message of messages) {
                try {
                    const fetchedMessage = await client.channels.cache.get(message.channelId).messages.fetch(message.messageId);

                    await fetchedMessage.edit({
                        content: '✅ This submission has been accepted.',
                        components: []
                    });
                } catch (err) {
                    if (err.code === 10008) {
                        console.warn(`Message ${message.messageId} in channel ${message.channelId} was not found. Skipping.`);
                    } else {
                        console.error(`Error updating message ${message.messageId}:`, err);
                    }
                }
            }

            await submissionManager.unmarkBatch(params.batchKey);
            await batchManager.deleteBatch(params.batchKey);

            const components = interaction.message.components.map(row => {
                // Filter only buttons and disable them
                const buttons = row.components
                    .filter(comp => comp.data?.type === 2) // 2 = button
                    .map(btn => ButtonBuilder.from(btn).setDisabled(true));

                // If the row has any buttons, return it
                return buttons.length > 0 ? new ActionRowBuilder().addComponents(buttons) : null;
            }).filter(row => row !== null);

            await interaction.update({
                content: '✅ This batch has been accepted.',
                components
            });

            for (const message of dsitributionMessages) {
                await client.channels.cache.get(guildConfig.channels.receptionist).send(message);
                await delay(500);
            }

        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                .setAuthor({name: `${interaction.member.user.username}`, iconURL: `${userAvatarUrl}`})
                .setTitle(`🛑 Error Occured 🛑`)
                .setDescription(`Some error can't be handled`)
                .addFields([
                    {
                        name: `🚧Button Used`,
                        value: "`batch-confirm`",
                    },
                    {
                        name: '📜Error message',
                        value: `>>> Error code:${err.code}\nError message:${err.message}`,
                    },
                ])
                .setColor(15844367)
                .setFooter({ text: `You can consult this to ${ ownerInfo.username }`, iconURL: `${ ownerInfo.avatarURL }`})
                .setTimestamp();
            await client.channels.cache.get(guildConfig.channels.errors).send({
                embeds: [errorEmbeds],
            });
            await interaction.reply({
                embeds: [errorEmbeds],
            });
        }
    },

}