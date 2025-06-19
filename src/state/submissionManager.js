const fs = require('fs');
const path = require('path');
const { Mutex } = require('async-mutex');

const filePath = path.resolve(__dirname, '../data/submission/submittedUsers.json');
let cache = {};
const mutex = new Mutex();

if (fs.existsSync(filePath)) {
    try {
        cache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error('Failed to load submitted users:', error);
    }
}

setInterval(() => {
    mutex.runExclusive(() => {
        fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), (error) => {
            if (error) console.error('Error in saving data:', error);
        });
    });
}, 5000);

const saveOnExit = () => {
    mutex.runExclusive(() => {
        fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
    });
};

process.on('SIGINT', () => { saveOnExit(); process.exit(); });
process.on('SIGTERM', () => { saveOnExit(); process.exit(); });
process.on('uncaughtException', (error) => { 
    console.error('Uncaught exception', error)
    saveOnExit(); 
    process.exit(1); 
});
process.on('unhandledRejection', (error) => { 
    console.error('Uncaught rejection', error)
    saveOnExit(); 
    process.exit(1); 
});

module.exports = {
    hasUserSubmitted: async(userId) => {
        return await mutex.runExclusive(() =>{
            for (const batchKey in cache) {
                if (cache[batchKey][userId]) {
                    return true;
                }
            }
            return false;
        });
    },

    markSubmittedUser: async(batchKey, userId, dbData, channelId, messageId) => {
        await mutex.runExclusive(() => {
            if (!cache[batchKey]) cache[batchKey] = {};

            cache[batchKey][userId] = {
                char_id: dbData.char_id,
                inGameName: dbData.inGameName,
                channelId: `${channelId}`,
                messageId: `${messageId}`
            };
        });
    },

    unmarkSubmittedUser: async(userId, batchKey) => {
        await mutex.runExclusive(() => {
            if (!cache[batchKey]) return;
            delete cache[batchKey][userId];
            if (Object.keys(cache[batchKey]).length === 0) delete cache[batchKey];
        });
    },

    unmarkBatch: async(batchKey) => {
        await mutex.runExclusive(() => {
            delete cache[batchKey];
        })
    },

    fetchBatchMessages: async(batchKey) => {
        return await mutex.runExclusive(() =>{
            const messages = [];

            if (!cache[batchKey]) return messages;

            for (const userId in cache[batchKey]) {
                const { channelId, messageId } = cache[batchKey][userId];
                messages.push({ channelId, messageId });
            }
            return messages;
        });
    },

    fetchUserMessage: async(userId, batchKey) => {
        return await mutex.runExclusive(() =>{
            if (!cache[batchKey] || !cache[batchKey][userId]) return null;

            const messages = cache[batchKey][userId];
            return messages;
        });
    },

    fetchBatch: async(batchKey) => {
        return await mutex.runExclusive(() =>{
            const users = {};

            if (!cache[batchKey]) return users;

            for (const userId in cache[batchKey]) {
                users[userId] = cache[batchKey][userId];
            }
            return users;
        });
    }
};