"use strict";
const { Client, Interaction, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, Application } = require('discord.js');
const { devs } = require('../../../config.json');
const { decodeCustomId } = require('../../utils/customId');
const submissionTracker = require('../../utils/submissionTracker');
/**
 * 
 * @param {Client} client 
 * @param {Interaction} interaction 
 */
module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;

    const submitChannel = '1374042127121518785';
    const { botName, action, params } = decodeCustomId(interaction.customId);
    
    if (botName === 'ravi') {

        if (action === 'submission-reject') {
            try {

                await submissionTracker.unmarkSubmitted(params.userId, params.batch);

                const components = interaction.message.components.map(row => {
                    return new ActionRowBuilder().addComponents(
                        row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                    );
                });

                await interaction.update({ 
                    content: '❌ This submission has been rejected.',
                    components 
                });

                await client.channels.cache.get(submitChannel).send(`<@${params.userId}> Your submission was rejected by ${interaction.member.user.username}.`);
        
            } catch (error) {
                console.error('There was an error with the button interaction.', error);        
            }
            return;
        }

        if (action === 'batch-reject') {
            try {

                let messages = await submissionTracker.fetchMessages(params.batch);
                
                for (const message of messages) {

                    const fetchedMessage = await client.channels.cache.get(message.channelId).messages.fetch(message.messageId);

                    const fetchedMessageComponents = fetchedMessage.components.map(row => {
                        return new ActionRowBuilder().setComponents(
                            row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                        )
                    });
                    
                    await fetchedMessage.edit({
                        content: '❌ This submission has been rejected.', 
                        components: fetchedMessageComponents 
                    });
                }

                await submissionTracker.unmarkBatch(params.batch);

                const components = interaction.message.components.map(row => {
                    return new ActionRowBuilder().addComponents(
                        row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
                    );
                });

                await interaction.update({ 
                    content: '❌ This batch has been rejected.',
                    components 
                });

            } catch (error) {
                console.error('There was an error with the button interaction.', error);        
            }
            return;
        }
    }
};