const crypto = require('crypto');
const { ec } = require('../wallet/wallet');

function verifyTransaction(tx) {
  if (tx.sender === 'ByteOpal System') return true; // reward tx

  if (!tx.signature || !tx.sender) return false;

  const key = ec.keyFromPublic(tx.sender, 'hex');
  const txCopy = { ...tx };
  delete txCopy.signature;

  const hash = crypto.createHash('sha256')
    .update(JSON.stringify(txCopy))
    .digest('hex');

  return key.verify(hash, tx.signature);
}

module.exports = { verifyTransaction };