const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Load environment variables from .env file // Assuming you have an instance of the blockchain
const { Wallet } = require('../wallet/wallet');
const User = require('../model/user'); // Assuming you have a User model defined
const router = express.Router();

const secret = process.env.JWT_SECRET || 'walletSecret'

const authMiddleware = (req, res, next) => {
    const token = req.cookies.token; // CORRECTED: Use 'token' cookie
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, secret); // CORRECTED: Use secret from env
        req.user = { userId: decoded.userId, walletAddress: decoded.walletAddress };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

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
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newWallet = new Wallet();

        const publicKey = newWallet.getPublicKey();
        const privateKey = newWallet.privateKey;

        req.session.tempPrivateKey = privateKey;
        req.session.save(async err => {
            if (err) {
                console.error('Session save error:', err);
                return res.status(500).json({ error: 'Failed to save session.' });
            }

            const newUser = new User({
                email: email,
                password: hashedPassword, // In a real application, you should hash the password before saving
                walletAddress: publicKey, // Placeholder, will be set after wallet creation
            });

            await newUser.save();

            // 3. ONLY send the response AFTER the session has been saved
            const token = jwt.sign({ userId: newUser._id, walletAddress: publicKey }, secret);
            res.cookie('token', token, { httpOnly: true });

            res.status(201).json({ 
                message: 'User registered successfully. Redirecting to private key page.',          
                walletAddress: newUser.walletAddress, 
            });
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ email }); // In a real application, you should hash the password and compare
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate a JWT token or set a cookie
        const token = jwt.sign({ userId: user._id, walletAddress: user.walletAddress }, secret);
        res.cookie('token', token, { httpOnly: true }); // Set a cookie with the wallet address
        // Optionally, you can also set a session or JWT token here

        res.status(200).json({ message: 'Login successful', walletAddress: user.walletAddress });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/private-key', async (req, res) => {
    if (req.session && req.session.tempPrivateKey) {
        const privateKey = req.session.tempPrivateKey;
        delete req.session.tempPrivateKey; // Clear the session variable after use
        return res.status(200).json({ privateKey });
    }
    res.status(400).json({ error: 'Private key not found in session or already revealed!' });
})

router.get('/logout', (req, res) => {
    res.clearCookie('token'); // Clear the cookie
    res.status(200).json({ message: 'Logout successful' });
});

router.get('/status', authMiddleware, (req, res) => {
    // The authMiddleware already did the work of verifying the token.
    // If we get here, the user is authenticated.
    res.status(200).json({ walletAddress: req.user.walletAddress });
});

module.exports = router;


