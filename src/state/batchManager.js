"use strict" ;
const fs = require('fs');
const path = require('path');
const BatchReviewer = require('../utils/class/BatchReviewer');

const activeBatchReviewsPath = path.resolve(__dirname, '../data/review/activeBatchReviews.json');
const batchManager = new Map();

function loadBatches() {
    if (fs.existsSync(activeBatchReviewsPath)) {
        try {
            const raw = fs.readFileSync(activeBatchReviewsPath, 'utf-8');
            const obj = JSON.parse(raw);
            for (const [batchKey, batchData] of Object.entries(obj)) {
                const batchReviewerInstance = new BatchReviewer(batchKey, batchData.user, batchData.currentPage);
                batchManager.set(batchKey, batchReviewerInstance);
            }
            console.log(`[Batch Manager] Loaded ${batchManager.size} batches from disk.`);
        } catch (err) {
            console.error('[Batch Manager] Failed to load batches from disk:', err);
        }
    }
}

function saveState() {
    const snapshot = {};

    for (const [batchKey, batchData] of batchManager.entries()) {
        snapshot[batchKey] = {
            currentPage: batchData.currentPage,
            user: batchData.interactionUser
        }
    }

    fs.writeFileSync(activeBatchReviewsPath, JSON.stringify(snapshot, null, 2));
}

loadBatches();

module.exports = {
    addBatch: async(batchKey, batchReviewerInstance) => {
        batchManager.set(batchKey, batchReviewerInstance);
        saveState();
    },

    fetchBatch: async(batchKey) => {
        return batchManager.get(batchKey);
    },

    deleteBatch: async(batchKey) => {
        batchManager.delete(batchKey);
        saveState();
    },
    saveState
};