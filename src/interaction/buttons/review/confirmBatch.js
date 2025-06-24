"use strict";
const { batchManager } = require('../../../state/globalState');
const { getGuildConfig } = require('../../../utils/guildConfig');
const { encodeCustomId } = require('../../../utils/customId');
const { ownerInfos } = require('../../../state/globalState');
const { Client, Interaction, ActionRowBuilder, ButtonBuilder, MessageFlags, EmbedBuilder, ButtonStyle } = require('discord.js');

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

        await interaction.deferUpdate();

        const guildConfig = getGuildConfig(interaction.guild.id);
        const userAvatarUrl = interaction.member.user.displayAvatarURL();
        const ownerInfo = await ownerInfos.get(client);
        try {

            const components = interaction.message.components.map(row => {
                // Filter only buttons and disable them
                const buttons = row.components
                    .filter(comp => comp.data?.type === 2) // 2 = button
                    .map(btn => ButtonBuilder.from(btn).setDisabled(true));

                // If the row has any buttons, return it
                return buttons.length > 0 ? new ActionRowBuilder().addComponents(buttons) : null;
            }).filter(row => row !== null);

            await interaction.message.edit({
                content: '🔄 Working on it, please wait...',
                components
            });

            await batchManager.deleteBatch(params.batchKey);

            const embeds = new EmbedBuilder()
                .setAuthor({name: interaction.member.user.username, iconURL: userAvatarUrl})
                .setTitle(`Batch Distribution`)
                .setDescription(`Are you sure you want to distribute the rewards?`)
                .addFields([
                    {
                        name: `Batch`,
                        value: `Batch ${params.batchKey.split('-')[1]}`
                    }
                ])
                .setColor(15844367)
                .setTimestamp();

            const confirmationRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${encodeCustomId(
                    'ravi',
                    'batch-distribution',
                    {
                        batchKey: params.batchKey,
                        interactionUserId: params.interactionUserId,
                    }
                    )}`)
                    .setLabel('Distribute')
                    .setStyle(ButtonStyle.Success)
            );
            await interaction.followUp({
                embeds:[embeds],
                components: [confirmationRow]
            })

            await interaction.message.edit({
                content: '✅ This batch has been reviewed.'
            });

        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                .setAuthor({name: interaction.member.user.username, iconURL: userAvatarUrl})
                .setThumbnail(client.user.displayAvatarURL())
                .setTitle(`🛑 Error Occurred 🛑`)
                .setDescription(`Some error can't be handled`)
                .addFields([
                    {
                        name: `🚧Button Used`,
                        value: "`batch-confirm`",
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

            await interaction.message.edit({
                content: '🛑 Error Occured, check with moderators 🛑',
                components: [] // Disable buttons to prevent further interactions if relevant
            });
        }
    },

}