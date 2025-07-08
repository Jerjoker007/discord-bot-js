const Bottleneck = require('bottleneck');

const editLimiter = new Bottleneck({
    minTime: 250,
    maxConcurrent: 1,
    reservoir: 60,
    reservoirRefreshAmount: 60,
    reservoirRefreshInterval: 10000
});

const sendLimiter = new Bottleneck({
    minTime: 250,
    maxConcurrent: 1,
    reservoir: 60,
    reservoirRefreshAmount: 60,
    reservoirRefreshInterval: 10000
});

module.exports = { 
    editLimiter, 
    sendLimiter 
};