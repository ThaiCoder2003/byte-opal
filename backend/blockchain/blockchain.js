const crypto = require('crypto'); // Assuming you have a utility to verify transactions
const BlockModel = require('../model/blockchainModel'); // Assuming you have a Mongoose model for Block
const TransactionModel = require('../model/transaction'); // Assuming you have a Mongoose model for Pending Transactions
const { Wallet } = require('../wallet/wallet');

class Block {
    constructor(index, previousHash = '', timestamp = Date.now(), data, hash, nonce = 0) {
        this.index = index;
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash;
        this.nonce = nonce; // Added nonce for mining
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
            this.hash = this.calculateHash();
            this.nonce++;
        } while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0"));
    }
}

class Transaction {
    constructor(inputs, outputs, id = null) {
        this.inputs = inputs;   // Array of { transactionId, outputIndex, address, signature }
        this.outputs = outputs; // Array of { amount, address }
        // If no ID is provided, calculate it. Otherwise, use the one from the database.
        this.id = id || crypto.createHash('sha256').update(JSON.stringify(this.inputs) + JSON.stringify(this.outputs)).digest('hex');
    }
}

class BlockChain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.difficulty = 1; // Difficulty level for mining
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
            this.chain = chain.map(b => new Block(
                b.index,
                b.previousHash,
                b.timestamp,
                b.data,
                b.hash,
                b.nonce
            ));
        }

        const pendingTransactions = await TransactionModel.find().sort({ timestamp: 1 });

        this.pendingTransactions = pendingTransactions.map(tx => 
            new Transaction(
                tx.inputs,
                tx.outputs,
                tx.hash // Use the MongoDB ID as the transaction ID
            )
        );
    }


    createGenesisBlock() {
        const genesisBlock = new Block(0, '0', Date.now().toString(), [], '');
        genesisBlock.hash = genesisBlock.calculateHash();
        return genesisBlock;
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

            if (currentBlock.hash.substring(0, this.difficulty) !== Array(this.difficulty + 1).join("0")) {
                console.error(`Proof of work is invalid for block ${currentBlock.index}`);
                return false;
            }
        }

        return true;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    findUTXOsForAddress(address) {
        const utxos = [];
        const spentOutputs = new Set();

        for (const block of this.chain) {
            for (const tx of block.data) {
                if (tx.inputs) {
                    for (const input of tx.inputs) {
                        if (input.address === address) {
                            spentOutputs.add(`${input.transactionId}:${input.outputIndex}`);
                        }
                    }
                }

                if (tx.outputs) {
                    tx.outputs.forEach((output, index) => {
                        if (output.address === address) {
                            const outputId = `${tx.id || tx.hash}:${index}`;
                            if (!spentOutputs.has(outputId)) {
                                utxos.push({
                                    transactionId: tx.id || tx.hash,
                                    outputIndex: index,
                                    amount: output.amount,
                                    address: output.address
                                });
                            }
                        }
                    });
                }
            }
        }

        return utxos;
    }

    async addTransaction(senderWallet, recipientAddress, amount) {
        const senderAddress = senderWallet.getPublicKey();
        const utxos = this.findUTXOsForAddress(senderAddress);
        const balance = utxos.reduce((total, utxo) => total + utxo.amount, 0);
        if (balance < amount) {
            throw new Error('Insufficient balance');
        }

        let totalInput = 0;
        const inputs = [];
        for (const utxo of utxos) {
            if (totalInput >= amount) break;
            totalInput += utxo.amount;
            inputs.push({
                transactionId: utxo.transactionId,
                outputIndex: utxo.outputIndex,
                address: senderAddress,
            });
        }

        const outputs = [
            { amount, address: recipientAddress }
        ];

        if (totalInput > amount) {
            outputs.push({
                amount: totalInput - amount,
                address: senderAddress // Change to sender address for change
            });
        }

        const transaction = new Transaction(inputs, outputs);

        transaction.inputs.forEach(input => {
            input.signature = senderWallet.sign(transaction.id);
        });

        this.pendingTransactions.push(transaction);
        await TransactionModel.create({
            hash: transaction.id,
            inputs: transaction.inputs,
            outputs: transaction.outputs,
        });

        return transaction;
    }

    async minePendingTransactions(minerAddress) {
        const rewardTx = new Transaction(
            [],
            [{ amount: this.miningReward, address: minerAddress }],
        );

        const blockTransactions = [rewardTx, ...this.pendingTransactions.slice(0, this.blockSize - 1)];

        const newBlock = new Block(
            this.chain.length,
            this.getLatestBlock().hash,
            Date.now().toString(),
            blockTransactions,
            '' // Initial hash will be calculated during mining
        );

        newBlock.mineBlock(this.difficulty);

        this.chain.push(newBlock);

        await BlockModel.create({
            index: newBlock.index,
            previousHash: newBlock.previousHash,
            timestamp: newBlock.timestamp,
            data: newBlock.data,
            hash: newBlock.hash,
            nonce: newBlock.nonce
        });

        const minedTxHashes = this.pendingTransactions.slice(0, this.blockSize - 1).map(tx => tx.id);

        // Clear the mined pending transactions from the database
        await TransactionModel.deleteMany({ hash: { $in: minedTxHashes } });

        this.pendingTransactions = this.pendingTransactions.slice(this.blockSize - 1);
    }

    getBalance(address) {
        const utxos = this.findUTXOsForAddress(address);
        return utxos.reduce((total, utxo) => total + utxo.amount, 0);
    }
}

module.exports = { BlockChain };