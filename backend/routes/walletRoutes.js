const express = require('express');
const { Wallet, ec } = require('../wallet/wallet');
const byteOpal = require('../blockchain/instance').byteOpal;
const Transaction = require('../model/transaction'); // Assuming you have a Mongoose model for Pending Transactions
const BlockchainModel = require('../model/blockchainModel');
const jwt = require('jsonwebtoken');
const router = express.Router();

const secret = process.env.JWT_SECRET || 'walletSecret';

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // CORRECTED: Use 'token' cookie
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, secret); // CORRECTED: Use secret from env
        req.user = { userId: decoded.userId, walletAddress: decoded.walletAddress };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

router.use(authMiddleware); // Apply auth middleware to all routes

router.get('/balance', async (req, res) => {
    try {
        const balance = await byteOpal.getBalance(req.user.walletAddress);
        res.status(200).json({ balance });
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/transaction', async (req, res) => {
    const { privateKey, recipient, amount } = req.body;
    const senderAddress = req.user.walletAddress; // Get sender address from the authenticated user

    if (!privateKey || !recipient || !amount) {
        return res.status(400).json({ error: 'Private key, recipient, and amount are required' });
    }

    try {
        const key = ec.keyFromPrivate(privateKey, 'hex');
        const senderWallet = new Wallet();
        senderWallet.keyPair = key; // Set the key pair from the provided private key
        senderWallet.publicKey = senderWallet.keyPair.getPublic('hex'); // Get the public

        // Security check: Ensure the sender's address matches the authenticated user's wallet address
        if (senderWallet.publicKey !== senderAddress) {
            return res.status(403).json({ error: 'Forbidden: Sender address does not match authenticated user' }); 
        }

        const transaction = await byteOpal.addTransaction(
            senderWallet,
            recipient,
            parseFloat(amount)
        );

        res.status(201).json({ message: 'Transaction added successfully', transaction });
    }
    catch (error) {
        console.error('Invalid private key:', error);
        return res.status(400).json({ error: 'Invalid private key' });
    }
});

router.get('/mine', async (req, res) => {
    try {
        await byteOpal.minePendingTransactions(req.user.walletAddress);
        res.status(200).json({ message: 'Block successfully mined!' });
    } catch (error) {
        console.error('Error mining transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/history', async (req, res) => {
    const walletAddress = req.user.walletAddress;
    const history = [];

    try {
        const entireChain = await BlockchainModel.find({}).sort({ index: 1 });

        entireChain.forEach(block => {
            block.data.forEach(tx => {
                const isSender = tx.inputs?.some(input => input.address === walletAddress);
                const isRecipient = tx.outputs?.some(output => output.address === walletAddress);

                if (!isSender && !isRecipient) {
                    return; // Not involved in this transaction
                }

                let type = '';
                let amount = 0;
                let counterparty = '';

                if (isSender) {
                    type = 'send';
                    // Find the output that went to someone else
                    const recipientOutput = tx.outputs.find(o => o.address !== walletAddress);
                    if (recipientOutput) {
                        amount = recipientOutput.amount;
                        counterparty = recipientOutput.address;
                    } else {
                        // Sent to self
                        amount = tx.outputs[0]?.amount || 0;
                        counterparty = walletAddress;
                    }
                } else { // Must be a recipient
                    type = 'receive';
                    amount = tx.outputs.find(o => o.address === walletAddress)?.amount || 0;
                    counterparty = tx.inputs?.[0]?.address || 'Mining Reward';
                }

                history.push({
                    hash: tx.id || tx.hash,
                    timestamp: block.timestamp,
                    type,
                    counterparty,
                    amount,
                    status: 'confirmed'
                });
            });
        });
        
        res.status(200).json({ transactions: history.sort((a, b) => b.timestamp - a.timestamp) });

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;