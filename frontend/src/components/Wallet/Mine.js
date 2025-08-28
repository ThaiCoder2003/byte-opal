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
            
            <button onClick={handleMine} disabled={isLoading}>
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