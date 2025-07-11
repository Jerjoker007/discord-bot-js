"use strict";
const path = require('path');
const getAllFiles = require('../utils/getAllFiles');
module.exports = (exceptions = []) => {
    let localCommands = [];
    const commandCategories = getAllFiles(path.join(__dirname, '../interaction', 'buttons'), true);
    for (const commandCategorie of commandCategories) {
        const commandFiles = getAllFiles(commandCategorie);
        for (const commandFile of commandFiles) {
            const commandObject = require(commandFile);
            if (exceptions.includes(commandObject.name)) {
                continue;
            }
            localCommands.push(commandObject);
        }
    }
    return localCommands;
};
