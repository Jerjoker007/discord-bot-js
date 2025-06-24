"use strict";
const { Client, Interaction, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const { batchManager, ownerInfos } = require('../../../state/globalState');
const { getGuildConfig } = require('../../../utils/guildConfig');

module.exports = {

    name: 'prev-page',
    description: 'Change the page on raviBatchReview command',

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     * @param {Object} params 
     */
    callback: async(client, interaction, params) => {

        await interaction.deferUpdate();

        const guildConfig = getGuildConfig(interaction.guild.id);
        const userAvatarUrl = interaction.member.user.displayAvatarURL();
        const ownerInfo = await ownerInfos.get(client);
        try {
            const batchReviewerInstance = await batchManager.fetchBatch(params.batchKey);
            await batchReviewerInstance.loadFile();
        
            batchReviewerInstance.prevPage();
    
            await interaction.message.edit({
                embeds: [batchReviewerInstance.generateEmbed()],
                components: batchReviewerInstance.buildComponents()
            });
        
            batchManager.saveState();
        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                .setAuthor({name: interaction.member.user.username, iconURL: userAvatarUrl})
                .setThumbnail(client.user.displayAvatarURL())
                .setTitle(`🛑 Error Occurred 🛑`)
                .setDescription(`Some error can't be handled`)
                .addFields([
                    {
                        name: `🚧Button Used`,
                        value: "`prev-page`",
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
                embeds: [],
                components: [] // Disable buttons to prevent further interactions if relevant
            });
        }
    }
};