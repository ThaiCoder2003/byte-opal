require('dotenv').config(); // Load .env config
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5001;

const authRoutes = require('./routes/authRoutes');
const walletRoutes = require('./routes/walletRoutes');
const blockchainRoutes = require('./routes/blockChainRoutes');

app.use(cors({
  origin: 'http://localhost:5000', // Your React frontend
  credentials: true // Allow cookies to be sent
}));

app.use(express.json());
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET || 'a_very_secret_key', // Use an environment variable for this
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true for HTTPS
}));
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {   
    console.error('MongoDB connection error:', err);
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/blockchain', blockchainRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


