const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/submittedUsers.json');

let cache = {};

if (fs.existsSync(filePath, 'utf8')) {
    try {
        cache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error('Failed to load submitted users:', error);
        cache = {};
    }
}

function save() {
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
}

module.exports = {
    hasSubmitted: (userId) => {
        return !!cache[userId];
    },

    markSubmitted: (userId) => {
        cache[userId] = true;
        save();
    },

    unmarkSubmitted: (userId) => {
        delete cache[userId];
        save();
    }
};