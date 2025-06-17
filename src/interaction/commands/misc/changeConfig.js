"use strict" ;
const { Client, Interaction, ApplicationCommandOptionType, MessageFlags, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { updateGuildConfig } = require('../../../utils/guildConfig');
const { ownerInfos } = require('../../../state/globalState');

module.exports = {

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {
        const userAvatarUrl = interaction.member.user.displayAvatarURL();
        const ownerInfo = await ownerInfos.get(client);
        try {
            const guildId = interaction.guildId;
    
            const type = interaction.options.getString('type');
            const channel = interaction.options.getChannel('channel')
    
            updateGuildConfig(guildId, (cfg) => {
                cfg.channels[type] = channel.id;
            });
    
            await interaction.reply({
                content: `✅ Channel for **${type}** set to <#${channel.id}>.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                .setAuthor({name: `${interaction.member.user.username}`, iconURL: `${userAvatarUrl}`})
                .setTitle(`🛑 Error Occured 🛑`)
                .setDescription(`Some error can't be handled`)
                .addFields([
                    {
                        name: `🚧Command Used`,
                        value: "`/ravi-config`",
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
                flags: MessageFlags.Ephemeral
            });
        }
    },

    name: 'ravi-config',
    description: `Configure server settings.`,
    options: [
        {
            name: 'channel',
            description: 'Set up bot channels',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'type',
                    description: 'Type of channel to configure.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: 'Receptionnist', value: 'receptionist'},
                        { name: 'Review', value: 'review'},
                        { name: 'Errors', value: 'errors'},
                    ]
                },
                {
                    name: 'channel',
                    description: 'The channel to assign.',
                    type: ApplicationCommandOptionType.Channel,
                    required: true
                }
            ]
        }
    ]

};