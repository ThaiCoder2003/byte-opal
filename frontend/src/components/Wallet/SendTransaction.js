import React, { useState } from 'react';
import api from '../../services/api'; // Your centralized api service

const SendTransactionPage = () => {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [privateKey, setPrivateKey] = useState('');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const handleSendTransaction = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const response = await api.post('/wallet/transaction', {
                recipient,
                amount: parseFloat(amount),
                privateKey
            });
            setSuccessMessage(response.data.message);
            // Clear the form on success
            setRecipient('');
            setAmount('');
            setPrivateKey('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send transaction.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="send-container">
            <h2>Send ByteOpal Coins</h2>
            <form onSubmit={handleSendTransaction}>
                <input
                    type="text"
                    placeholder="Recipient's Wallet Address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    required
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0"
                />
                <input
                    type="password" // Use password type to hide the key
                    placeholder="Your Private Key (to sign)"
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    required
                />
                <button 
                    type="submit" 
                    disabled={isLoading}                
                    style={{
                        padding: '12px 32px',
                        fontSize: '1rem',
                        backgroundColor: isLoading ? '#ccc' : '#a700d1ff',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        transition: 'background 0.2s'
                    }}
                >
                    {isLoading ? 'Sending...' : 'Send Transaction'}
                </button>
            </form>
            <div className="transaction-status">
                {successMessage && <p className="success-message">{successMessage}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
            <p style={{ color: 'orange', marginTop: '1rem' }}>
                <strong>Note:</strong> In a real application, you would never paste your private key here. This is a simplification for this project.
            </p>
        </div>
    );
};

export default SendTransactionPage;