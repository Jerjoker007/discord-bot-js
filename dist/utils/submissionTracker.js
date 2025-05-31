const fs = require('fs');
const path = require('path');
const { Mutex } = require('async-mutex');

const filePath = path.join(__dirname, '../data/submittedUsers.json');
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
    hasSubmitted: async(userId) => {
        return await mutex.runExclusive(() =>{
            for (const batch in cache) {
                if (cache[batch][userId]) {
                    return true;
                }
            }
            return false;
        });
    },

    markSubmitted: async(userId, batch, channelId, messageId) => {
        await mutex.runExclusive(() => {
            if (!cache[batch]) cache[batch] = {};

            cache[batch][userId] = {
                channelId: `${channelId}`,
                messageId: `${messageId}`
            };
        });
    },

    unmarkSubmitted: async(userId, batch) => {
        await mutex.runExclusive(() => {
            if (!cache[batch]) return;
            delete cache[batch][userId];
            if (Object.keys(cache[batch]).length === 0) delete cache[batch];
        });
    },

    unmarkBatch: async(batch) => {
        await mutex.runExclusive(() => {
            delete cache[batch];
        })
    },

    fetchMessages: async(batch) => {
        return await mutex.runExclusive(() =>{
            const messages = [];

            if (!cache[batch]) return messages;

            for (const userId in cache[batch]) {
                const { channelId, messageId } = cache[batch][userId];
                messages.push({ channelId, messageId });
            }
            return messages;
        });
    }
};