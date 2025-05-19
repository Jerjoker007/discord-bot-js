const path = require('path');
const getAllFiles = require('../utils/getAllFiles');

module.exports = (ravi: any) => {
    const eventFolders = getAllFiles(path.join(__dirname, '..', 'events'), true);

    for (const eventFolder of eventFolders) {
        const eventFiles = getAllFiles(eventFolder);
        eventFiles.sort((a: any, b: any) => a > b);
        
        const eventName = eventFolder.replace(/\\/g, '/').split('/').pop();
        
        ravi.on(eventName, async (arg: any) => {
            for (const eventFile of eventFiles) {
                const eventFunction = require(eventFile);
                await eventFunction(ravi, arg);
            }
        })
    }
};