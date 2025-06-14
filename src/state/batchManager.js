"use strict" ;
const fs = require('fs');
const path = require('path');
const BatchReviewer = require('../utils/class/BatchReviewer');

const activeBatchReviewsPath = path.resolve(__dirname, '../data/activeBatchReviews.json');
const batchManager = new Map();

function loadBatches() {
    if (fs.existsSync(activeBatchReviewsPath)) {
        try {
            const raw = fs.readFileSync(activeBatchReviewsPath, 'utf-8');
            const obj = JSON.parse(raw);
            for (const [batchKey, batchData] of Object.entries(obj)) {
                const batchReviewerInstance = new BatchReviewer(batchKey, batchData.user, batchData.currentPage);
                batchReviewerInstance.loadFile();
                batchManager.set(batchKey, batchReviewerInstance);
            }
            console.log(`Loaded ${batchManager.size} batches from disk.`);
        } catch (err) {
            console.error('Failed to load batches from disk:', err);
        }
    }
}

function saveState() {
    const snapshot = {};

    for (const [batchKey, batchData] of batchManager.entries()) {
        snapshot[batchKey] = {
            currentPage: batchData.currentPage,
            user: batchData.user
        }
    }

    fs.writeFileSync(activeBatchReviewsPath, JSON.stringify(snapshot, null, 2));
}

loadBatches();

module.exports = {
    addBatch(batchKey, batchReviewerInstance) {
        batchManager.set(batchKey, batchReviewerInstance);
        saveState();
    },

    fetchBatch(batchKey) {
        return batchManager.get(batchKey);
    },

    deleteBatch(batchKey) {
        batchManager.delete(batchKey);
        saveState();
    },
    saveState
};