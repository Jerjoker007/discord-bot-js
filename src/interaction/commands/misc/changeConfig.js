"use strict" ;
const { Client, Interaction, ApplicationCommandOptionType, MessageFlags, EmbedBuilder } = require("discord.js");
const { createPool, getPool, testConnection } = require('../../../utils/dbConnection');
const { updateGuildConfig, updateConfig } = require('../../../utils/configManager');
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
            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'channel') {
                const guildId = interaction.guildId;
        
                const type = interaction.options.getString('type');
                const channel = interaction.options.getChannel('channel');
        
                updateGuildConfig(guildId, (cfg) => {
                    cfg.channels[type] = channel.id;
                });
        
                await interaction.reply({
                    content: `✅ Channel for **${type}** set to <#${channel.id}>.`,
                    flags: MessageFlags.Ephemeral
                });

            } else if (subcommand === 'database') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                const type = interaction.options.getString('type');
                const dataString = interaction.options.getString('data');

                updateConfig((cfg) => {
                    cfg[type] = dataString;
                });

                await createPool();
                const isConnected = await testConnection();
                client.db = await getPool();

                if (isConnected) {
    
                    return await interaction.editReply({
                        content: `✅ Database IP is now set to **${dataString}** and connection to it was restarted.`,
                    });
                } else {
                    return await interaction.editReply({
                        content: `⚠️ Database IP is now set to **${dataString}** but was unnable to connect to it. You will either have to restart the bot or change the IP with the same command.`,
                    });
                }
            }
        } catch (err) {
            const errorEmbeds = new EmbedBuilder()
                .setAuthor({name: interaction.member.user.username, iconURL: userAvatarUrl})
                .setThumbnail(client.user.displayAvatarURL())
                .setTitle(`🛑 Error Occurred 🛑`)
                .setDescription(`Some error can't be handled`)
                .addFields([
                    {
                        name: `🚧Command Used`,
                        value: "`/ravi-config`",
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
                .setFooter({ text: `You can consult this to ${ ownerInfo.username }`, iconURL: ownerInfo.avatarURL})
                .setTimestamp();
            await interaction.reply({
                embeds: [errorEmbeds],
                flags: MessageFlags.Ephemeral
            });
        }
    },

    name: 'ravi-config',
    description: `Configure server and database settings.`,
    devOnly: true,
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
        },
        {
            name: 'database',
            description: 'Change the database configs for the bot.',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: 'type',
                    description: 'What data to configure.',
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    choices: [
                        { name: 'Host', value: 'databaseIP'},
                    ]
                },
                {
                    name: 'data',
                    description: 'The data to assign.',
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        }
    ]

};