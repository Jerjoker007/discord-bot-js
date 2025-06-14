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
const { batchManager, submissionManager } = require('../../state/globalState');
const BatchReviewer = require('../../utils/class/BatchReviewer');

module.exports = {

    /**
     * 
     * @param {Client} client 
     * @param {Interaction} interaction 
     */
    callback: async (client, interaction) => {

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
            username: `${interaction.member.user.username}`,
            avatarURL: `${interaction.member.user.avatarURL() ?? interaction.member.user.defaultAvatarURL}`
        };

        const batchReviewer = new BatchReviewer(batchKey, interactionUser);
        await batchReviewer.loadFile();
        
        await interaction.reply({
            embeds: [batchReviewer.generateEmbed()],
            components: batchReviewer.buildComponents()
        });

        batchManager.addBatch(batchKey, batchReviewer);
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