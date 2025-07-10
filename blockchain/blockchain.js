const crypto = require('crypto'); // Assuming you have a utility to verify transactions
const BlockModel = require('../model/blockchainModel'); // Assuming you have a Mongoose model for Block
const Transaction = require('../model/transaction'); // Assuming you have a Mongoose model for Pending Transactions
const { Wallet } = require('../wallet/wallet');

class Block {
    constructor(index, previousHash = '', timestamp, data, hash) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.nonce = 0; // Added nonce for mining
    }
    
    calculateHash() {
        return crypto.createHash('sha256')
            .update(
                this.index +
                this.previousHash +
                this.timestamp +
                JSON.stringify(this.data) +
                this.nonce
            )
            .digest('hex');
    }

    mineBlock(difficulty) {
        do {
            this.hash = this.calculateHash(this.index, this.previousHash, this.timestamp, JSON.stringify(this.data), this.nonce);
            this.nonce++;
        } while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0"));
    }
}

class BlockChain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.difficulty = 2; // Difficulty level for mining
        this.miningReward = 100; // Reward for mining a block
        this.blockSize = 5; // Maximum number of transactions per block
    }

    async initializeChain() {
        const chain = await BlockModel.find().sort({ index: 1 });

        if (chain.length === 0) {
            const genesis = this.createGenesisBlock();
            await BlockModel.create(genesis);
            this.chain = [genesis];
        } else {
            this.chain = chain;
        }

        const pendingTransactions = await Transaction.find().sort({ timestamp: 1 });

        this.pendingTransactions = pendingTransactions.map(tx => ({
            sender: tx.sender,
            recipient: tx.recipient,
            amount: tx.amount,
            signature: tx.signature,
            timestamp: tx.timestamp
        }));
    }


    createGenesisBlock() {
        return new Block(0, '0', Date.now().toString(), 'Genesis Block', '0');
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            // Check if the hash of the current block is correct
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.error(`Invalid hash at block ${currentBlock.index}`);
                return false;
            }

            // Check signature of each transaction in the block
            for (const tx of currentBlock.data) {
                if (!Wallet.verifySignature(tx)) {
                    console.error(`Invalid transaction signature in block ${currentBlock.index}`);
                    return false;
                }
            }

            // Check if the previous hash matches
            if (currentBlock.previousHash !== previousBlock.hash) {
                console.error(`Invalid previous hash at block ${currentBlock.index}`);
                return false;
            }
        }
        return true;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addTransaction(transaction) {
        // Validate the transaction
        if (!transaction.sender || !transaction.recipient || !transaction.amount || !transaction.signature) {
            throw new Error('Transaction must include sender, recipient, and amount');
        }
        if (Wallet.verifySignature(transaction) === false) {
            throw new Error('Invalid transaction signature');
        }
        this.pendingTransactions.push(transaction);
    }

    async minePendingTransactions(minerAddress) {
        if (this.pendingTransactions.length === 0) {
            console.log('No transactions to mine');
            return;
        }

        const rewardTx = {
            sender: 'ByteOpal System',
            recipient: minerAddress,
            amount: this.miningReward,
            signature: '', // Reward transactions do not require a signature
            timestamp: Date.now().toString()
        };

        const transactions = [...this.pendingTransactions.slice(0, this.blockSize)];
        transactions.unshift(rewardTx);
        const block = new Block(
            this.chain.length,
            this.getLatestBlock().hash,
            Date.now().toString(),
            transactions,
            '' // Initial hash will be calculated during mining
        );

        block.mineBlock(this.difficulty);

        await BlockModel.create({
            index: block.index,
            previousHash: block.previousHash,
            timestamp: block.timestamp,
            data: block.data,
            hash: block.hash,
            nonce: block.nonce
        });

        this.chain.push(block);
        this.pendingTransactions = this.pendingTransactions.slice(this.blockSize - 1); // Remove mined transactions

        // Save the mined transactions to the database
        const idsToRemove = await PendingTransactionModel.find()
            .sort({ timestamp: 1 })
            .limit(this.blockSize - 1)
            .select('_id');

        await Transaction.deleteMany({ _id: { $in: idsToRemove.map(tx => tx._id) } });
    }

    getBalance(address) {
        let balance = 0;
        for (const block of this.chain) {
            for (const tx of block.data) {
                if (tx.recipient === address) {
                    balance += tx.amount;
                } else if (tx.sender === address) {
                    balance -= tx.amount;
                }
            }
        }
        return balance;
    }
}

module.exports = { BlockChain };