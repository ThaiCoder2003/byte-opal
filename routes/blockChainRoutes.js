const express = require('express');
const Blockchain = require('../blockchain/blockchain');
const router = express.Router();

const byteOpal = new Blockchain();

router.get('/chain', (req, res) => {
  res.json(byteOpal.chain);
});

router.post('transaction', (req, res) => {
  const { sender, recipient, amount } = req.body;

  if (!sender || !recipient || !amount) {
    return res.status(400).json({ error: 'Missing transaction data' });
  }

  const newTransaction = byteOpal.createTransaction(sender, recipient, amount);
  res.status(201).json(newTransaction);
});

router.get('/mine', (req, res) => {
  byteOpal.minePendingTransactions();
  res.status(200).json({
    message: 'New block mined successfully',
    block: byteOpal.getLatestBlock()
  });
});