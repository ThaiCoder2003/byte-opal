const express = require('express');
const { Wallet } = require('../../wallet/wallet');
const byteOpal = require('../../blockchain/instance').byteOpal;
const Transaction = require('../../model/transaction'); // Assuming you have a Mongoose model for Pending Transactions

const router = express.Router();

router.get('/chain', (req, res) => {
  res.json(byteOpal.chain);
});

router.get('/validate', (req, res) => {
  const isValid = byteOpal.isChainValid();
  res.json({ valid: isValid });
});

router.post('/transaction', async (req, res) => {
  const { sender, recipient, amount, signature } = req.body;

  if (!sender || !recipient || !amount) {
    return res.status(400).json({ error: 'Missing transaction data' });
  }

  const transaction = {
    sender,
    recipient,
    amount,
    signature
  };

  // addTransaction already checks for valid signature and sufficient balance
  // Add the transaction to the pending transactions
  const newTransaction = byteOpal.addTransaction(transaction);
  await Transaction.create(transaction); // Save transaction to the database

  res.status(201).json(newTransaction);
});

module.exports = router;
