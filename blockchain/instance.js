const { BlockChain } = require('./blockchain');

const byteOpal = new BlockChain();

// Initialize the chain when the app starts
(async () => {
  await byteOpal.initializeChain();
})();

module.exports = { byteOpal };