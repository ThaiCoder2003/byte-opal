const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables from .env file
const { byteOpal } = require('./blockchain/instance'); // Assuming you have an instance of the blockchain
const { Wallet, ec } = require('../wallet/wallet');
const User = require('../model/user'); // Assuming you have a User model defined
const router = express.Router();
const Transaction = require('../model/transaction'); // Assuming you have a Transaction model defined

router.post('/register', async (req, res) => {
    const { email, password, confirmPassword } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }
    
    try {

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newWallet = new Wallet();
        // Create a new user
        const newUser = new User({
            email: email,
            password: hashedPassword, // In a real application, you should hash the password before saving
            walletAddress: newWallet.getPublicKey(), // Placeholder, will be set after wallet creation
        });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', walletAddress: wallet.walletAddress });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username }); // In a real application, you should hash the password and compare
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate a JWT token or set a cookie
        const token = jwt.sign({ userId: user._id, walletAddress: user.walletAddress }, process.env.JWT_SECRET || 'walletSecret', { expiresIn: '24h' });

        res.cookie('authToken', token, { httpOnly: true }); // Set a cookie with the wallet address
        // Optionally, you can also set a session or JWT token here

        res.status(200).json({ message: 'Login successful', walletAddress: user.walletAddress });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/balance', async (req, res) => {
    const token = req.cookies.authToken; // Get the token from cookies
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }   

    // Get wallet address from the token
    let walletAddress;
    try {
        const decoded = jwt.verify(token, 'wallet'); // Verify the token
        walletAddress = decoded.walletAddress; // Get the wallet address from the token
    }

    catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const balance = byteOpal.getBalance(walletAddress); // Get the balance from the blockchain instance
        if (balance === null || balance === undefined) {
            return res.status(404).json({ error: 'Balance not found' });
        }
        // Return the balance as a JSON response
        res.status(200).json({ balance });
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/transaction', async (req, res) => {
    const { privateKey, recipient, amount } = req.body;

    if (!privateKey || !recipient || !amount) {
        return res.status(400).json({ error: 'Private key, recipient, and amount are required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wallet');
        const sender = decoded.walletAddress;

        // Verify the private key
        const key = ec.keyFromPrivate(privateKey, 'hex');
        if (!key) {
            return res.status(400).json({ error: 'Invalid private key' });
        }

        const transaction = {
            sender: sender,
            recipient: recipient,
            amount: amount,
            timestamp: Date.now(),
        };

        // Sign the transaction
        const hash = Wallet.prototype.hashData(transaction);
        const signature = key.sign(hash).toDER('hex');
        
        const signedTransaction = {
            ...transaction,
            signature: signature,
        };
        // Adding Transaction function already checks for valid signature and sufficient balance
        // If the transaction is invalid, it will throw an error
        // Add the transaction to the blockchain
        byteOpal.addTransaction(signedTransaction);
        await Transaction.create(signedTransaction); // Save the transaction to the database

        res.status(201).json({ message: 'Transaction added successfully', transaction: signedTransaction });
    }
    catch (error) {
        console.error('Invalid private key:', error);
        return res.status(400).json({ error: 'Invalid private key' });
    }
});

router.get('/mine', async (req, res) => {
    const token = req.cookies.authToken; // Get the token from cookies
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get wallet address from the token
    let walletAddress;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'wallet');
        walletAddress = decoded.walletAddress; // Get the wallet address from the token
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        await byteOpal.minePendingTransactions(walletAddress); // Mine pending transactions for the user's wallet address
        // Save the mined transactions to the database
        res.status(200).json({ message: 'Mining successful' });
    } catch (error) {
        console.error('Error mining transactions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

