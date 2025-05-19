"use strict";
module.exports = async (ravi, guildId) => {
    let applicationCommands;
    if (guildId) {
        const guild = await ravi.guilds.fetch(guildId);
        applicationCommands = guild.commands;
    }
    else {
        applicationCommands = await ravi.application.commands;
    }
    await applicationCommands.fetch();
    return applicationCommands;
};
