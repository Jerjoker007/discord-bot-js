"use strict";
const { Ravi, Interaction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
module.exports = {
    /**
     *
     * @param {Ravi} ravi
     * @param {Interaction} interaction
     */
    callback: async (ravi, interaction) => {
        await interaction.reply({
            embeds: [{
                author: {
                name: "Ravi"
                },
                title: "Raviente's Submission",
                description: `<@${interaction.member.id}> ${interaction.options.get('batch').value}`,
                //image: {
                //url: "imageUrl"
                //},
                thumbnail: {
                url: "https://dan.onl/images/emptysong.jpg"
                },
                color: "2",
                footer: {
                text: "Example Footer",
                icon_url: "https://slate.dan.onl/slate.png"
                },
                timestamp: "2025-05-20T10:20:00"
            }]
        });
    },
    name: 'ravi-submit',
    description: `Submission for the Raviente's raid event`,
    // devOnly: Boolean,
    // testOnly: Boolean,
    options: [
        {
            name: 'image',
            description: 'Screenshot of phase 4 or 5 to prove yourself.',
            type: ApplicationCommandOptionType.Attachment,
            required: true,
        },
        {
            name: 'batch',
            description: 'Which batch did you participated.',
            type: ApplicationCommandOptionType.String,
            choices: [
                {
                    name: 'Batch 1',
                    value: 'batch-1',
                },
                {
                    name: 'Batch 2',
                    value: 'batch-2',
                },
                {
                    name: 'Batch 3',
                    value: 'batch-3',
                },
                {
                    name: 'Batch 4',
                    value: 'batch-4',
                },
            ],
            required: true,
        },
    ],
};
