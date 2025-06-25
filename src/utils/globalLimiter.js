const Bottleneck = require('bottleneck');

const globalLimiter = new Bottleneck({
    minTime: 250,
    maxConcurrent: 1,
    reservoir: 45,
    reservoirRefreshAmount: 45,
    reservoirRefreshInterval: 10000
});

module.exports = globalLimiter;