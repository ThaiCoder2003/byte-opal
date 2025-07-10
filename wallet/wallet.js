const EC = require('elliptic').ec;
const ec = new EC('secp256k1'); // Using secp256k1 curve for Bitcoin-like wallets
const crypto = require('crypto'); // For hashing data

class Wallet{
    constructor() {
        this.keyPair = ec.genKeyPair(); // Generate a new key pair
        this.publicKey = this.keyPair.getPublic('hex'); // Get the public key in
        this.privateKey = this.keyPair.getPrivate('hex'); // Get the private key in hex format
    }

    getPublicKey() {
        return this.publicKey; // Return the public key
    }

    sign(data) {
        const hash = this.hashData(data); // Hash the data to be signed
        return this.keyPair.sign(hash).toDER('hex'); // Sign the hash and return it in DER format
    }

    static verifySignature(transaction) {
        if (transaction.sender === 'ByteOpal System') return true; // skip for reward tx
        if (!transaction.signature || !transaction.sender || !transaction.recipient) return false;

        const { signature, ...txData } = transaction;
        const hash = crypto.createHash('sha256')
            .update(JSON.stringify(txData))
            .digest('hex');

        try {
            const key = ec.keyFromPublic(transaction.sender, 'hex');
            return key.verify(hash, signature);
        } catch (err) {
            console.error('Signature verification failed:', err.message);
            return false;
        }
    }

    static calculateBalance(address, blockchain) {
        let balance = 0;
        blockchain.chain.forEach(block => {
            block.data.forEach(transaction => {
                if (transaction.sender === address) {
                    balance -= transaction.amount; // Deduct amount for transactions sent
                }
                if (transaction.recipient === address) {
                    balance += transaction.amount; // Add amount for transactions received
                }
            });
        });
        return balance; // Return the calculated balance
    }

    hashData(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex'); // Hash the data using SHA-256
    }
}

module.exports = { Wallet, ec }; // Export the Wallet class and elliptic curve instance