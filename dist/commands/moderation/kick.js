"use strict";
const {  Ravi, Interaction, ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
module.exports = {
    /**
     *
     * @param {Ravi} ravi
     * @param {Interaction} interaction
     */
    callback: async (ravi, interaction) => {
        const targetUserId = interaction.options.get('target-user').value;
        const reason = interaction.options.get('reason')?.value || "No reason provided";
        await interaction.deferReply();
        const targetUser = await interaction.guild.members.fetch(targetUserId);
        if (!targetUser) {
            await interaction.editReply("That user no longer exists in this server.");
            return;
        }
        if (targetUser.id === interaction.guild.ownerId) {
            await interaction.editReply("You can't kick the owner of the server.");
            return;
        }
        const targetUserRolePosition = targetUser.roles.highest.position; // Highest role of the target user
        const requestUserRolePosition = interaction.member.roles.highest.position;
        const botRolesPosition = interaction.guild.members.me.roles.highest.position;
        if (targetUserRolePosition >= requestUserRolePosition) {
            await interaction.editReply("You can't kick a user with the same/higher role.");
            return;
        }
        if (targetUserRolePosition >= botRolesPosition) {
            await interaction.editReply("I can't kick a user with the same/higher role.");
            return;
        }
        try {
            await targetUser.kick({ reason });
            await interaction.editReply(`User ${targetUser} was kicked\nReason: ${reason}.`);
        }
        catch (error) {
            console.log(`There was an error when kicking: ${error}.`);
        }
    },
    name: 'kick',
    description: 'Kicks a member from the server.',
    // devOnly: Boolean,
    // testOnly: Boolean,
    options: [
        {
            name: 'target-user',
            description: 'The user to kick.',
            type: ApplicationCommandOptionType.Mentionable,
            required: true,
        },
        {
            name: 'reason',
            description: 'The reason for kicking.',
            type: ApplicationCommandOptionType.String,
        },
    ],
    permissionRequired: [PermissionFlagsBits.KickMembers],
    botPermissions: [PermissionFlagsBits.KickMembers],
};
