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
        const guildConfig = getGuildConfig(interaction.guild.id);
        const userAvatarUrl = interaction.member.user.displayAvatarURL();
        const ownerInfo = await ownerInfos.get(client);
        try {
            const batchReviewerInstance = await batchManager.fetchBatch(params.batchKey);
            await batchReviewerInstance.loadFile();
        
            batchReviewerInstance.prevPage();
    
            await interaction.update({
                embeds: [batchReviewerInstance.generateEmbed()],
                components: batchReviewerInstance.buildComponents()
            });
        
            batchManager.saveState();
        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                .setAuthor({name: `${interaction.member.user.username}`, iconURL: `${userAvatarUrl}`})
                .setTitle(`🛑 Error Occured 🛑`)
                .setDescription(`Some error can't be handled`)
                .addFields([
                    {
                        name: `🚧Button Used`,
                        value: "`prev-page`",
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
    }
};