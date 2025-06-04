module.exports =  {
    encodeCustomId(botName, action, params = {}) {
        const paramString = Object.entries(params)
            .map(([key, value]) => `${key}:${value}`)
            .join('|');
        return paramString ? `${botName}|${action}|${paramString}` : `${botName}|${action}`;
    },

    decodeCustomId(customId) {
        const [botName, action, ...params] = customId.split('|');
        const paramMap = Object.fromEntries(params.map(p => p.split(':')));
        return {botName, action, params: paramMap};
    },
}