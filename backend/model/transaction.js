const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const transactionSchema = new Schema({
    hash: { type: String, required: true, unique: true },
    inputs: [{
        transactionId: String, // Hash of the referenced transaction
        outputIndex: Number,
        signature: String,
        address: String // The public key or address of the sender
    }],
    outputs: [{
        amount: Number,
        address: String // The public key or address of the recipient
    }],
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('transaction', transactionSchema);