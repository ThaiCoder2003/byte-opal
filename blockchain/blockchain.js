const crypto = require('crypto');

class Block {
    constructor(index, previousHash = '', timestamp, data, hash) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.nonce = 0; // Added nonce for mining
    }
    
    static calculateHash() {
        const [index, previousHash, timestamp, data, nonce] = arguments;
        return crypto.createHash('sha256')
            .update(index + previousHash + timestamp + data + nonce)
            .digest('hex');
    }

    static mineBlock(difficulty) {
        while (!this.hash.startsWith('0'.repeat(difficulty))) {
            this.nonce++;
            this.hash = Block.calculateHash(this.index, this.previousHash, this.timestamp, this.data, this.nonce);
        }
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
        this.difficulty = 2; // Difficulty level for mining
    }

    createGenesisBlock() {
        return new Block(0, '0', Date.now().toString(), 'Genesis Block', '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addTransaction(transaction) {
        this.pendingTransactions.push(transaction);
    }

    minePendingTransactions(minerAddress) {
        if (this.pendingTransactions.length === 0) {
            console.log('No transactions to mine');
            return;
        }

        const rewardTx = {
            sender: 'ByteOpal System',
            receiver: minerAddress,
            amount: this.miningReward
        };

        const transactions = [rewardTx, ...this.pendingTransactions];

        const block = new Block(
            this.chain.length,
            this.getLatestBlock().hash,
            Date.now().toString(),
            transactions,
            ''
        );

        block.mineBlock(this.difficulty);

        this.chain.push(block);
        this.pendingTransactions = [];
    }

    getBalance(address) {
        let balance = 0;
        for (const block of this.chain) {
            for (const tx of block.data) {
                if (tx.receiver === address) {
                    balance += tx.amount;
                } else if (tx.sender === address) {
                    balance -= tx.amount;
                }
            }
        }
        return balance;
    }
}