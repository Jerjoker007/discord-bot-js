module.exports = (exceptions: any = []) => {
    let localCommands = [];

    const commandCategories = getAllFiles(
        path.join(__dirname, '..', 'commands'),
        true
    );

    for (const commandCategorie of commandCategories) {
        const commandFiles = getAllFiles(commandCategorie);

        for (const commandFile of commandFiles) {
            const commandObject= require(commandFile);
            
            if (exceptions.includes(commandObject.name)) {
                continue;
            }

            localCommands.push(commandObject);
        }
    }

    return localCommands;
};