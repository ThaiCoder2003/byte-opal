const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
    index: Number,
    timestamp: String,
    previousHash: String,
    hash: String,
    nonce: Number,
    transactions: Array,
});

module.exports = mongoose.model('Block', blockSchema);