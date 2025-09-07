import React, { useState } from 'react';
import api from '../../services/api';

const MinePage = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleMine = async () => {
        setIsLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await api.get('/wallet/mine');
            setMessage(response.data.message);
        } catch (err) {
            setError('Mining failed. There may be no pending transactions to mine.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mine-container">
            <h2>Mine a New Block</h2>
            <p>
                Click the button below to start mining. This will process a batch of pending transactions from the network.
                If you successfully mine the block, a reward will be sent to your wallet address.
            </p>
            
            <button
                onClick={handleMine}
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
                {isLoading ? 'Mining in Progress...' : 'Start Mining'}
            </button>

            <div className="mine-status">
                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
}

export default MinePage;