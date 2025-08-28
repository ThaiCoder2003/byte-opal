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

    sign(dataHash) {
        return this.keyPair.sign(dataHash).toDER('hex'); // Sign the hash and return it in DER format
    }

    static verifySignature(transaction) {
        if (!transaction.inputs || transaction.inputs.length === 0) {
            return true;
        }
        const txHash = transaction.id || transaction.hash;
        if (!txHash) {
            console.error("Transaction is missing a hash to verify against.");
            return false;
        }

        for (const input of transaction.inputs) {
            if (!input.signature || !input.address) {
                console.error("Input is missing signature or address.");
                return false;
            }

            try {
                // The public key is the 'address' of the UTXO being spent.
                const key = ec.keyFromPublic(input.address, 'hex');

                // Verify that the input's signature correctly signed the transaction hash.
                if (!key.verify(txHash, input.signature)) {
                    // If any signature is invalid, the entire transaction is invalid.
                    return false;
                }
            } catch (err) {
                console.error('Signature verification failed for an input:', err.message);
                return false;
            }
        }
    }

    hashData(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex'); // Hash the data using SHA-256
    }
}

module.exports = { Wallet, ec }; // Export the Wallet class and elliptic curve instance