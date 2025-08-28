const express = require('express');
const byteOpal = require('../blockchain/instance').byteOpal;// Assuming you have a Mongoose model for Pending Transactions

const router = express.Router();

router.get('/chain', (req, res) => {
  res.json(byteOpal.chain);
});

router.get('/validate', (req, res) => {
  const isValid = byteOpal.isChainValid();
  res.json({ valid: isValid });
});

module.exports = router;
