const { User } = require('discord.js');
let cachedOwnerInfo = null;
module.exports = {

    get: async(client) => {
        if (cachedOwnerInfo) return cachedOwnerInfo;

        await client.application.fetch();
        const owner = client.application.owner;


        if (!(owner instanceof User)) throw new Error('Unable to determine bot owner.');

        cachedOwnerInfo = {
            username: owner.username,
            avatarURL: owner.displayAvatarURL({ dynamic: true }),
        }
        
        return cachedOwnerInfo;
    }
}