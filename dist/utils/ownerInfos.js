const { User } = require('discord.js');
let cachedOwnerInfo = null;
module.exports = {

    async getBotOwnerInfos(ravi) {
        if (cachedOwnerInfo) return cachedOwnerInfo;

        await ravi.application.fetch();
        const owner = ravi.application.owner;


        if (!(owner instanceof User)) throw new Error('Unable to determine bot owner.');

        cachedOwnerInfo = {
            username: owner.username,
            avatarURL: owner.displayAvatarURL({ dynamic: true }),
        }
        
        return cachedOwnerInfo;
    }
}