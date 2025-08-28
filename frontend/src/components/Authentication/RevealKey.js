import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../../services/api'; // Adjust the import path as necessary
const RevealKey = () => {
    const [privateKey, setPrivateKey] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const hasFetchedKey = useRef(false);

    useEffect(() => {
        if (hasFetchedKey.current === false) {
            const fetchKey = async () => {
                try {
                    const response = await api.get('/auth/private-key');
                    setPrivateKey(response.data.privateKey);
                } catch (err) {
                    setError('Could not retrieve private key. It may have already been revealed.');
                }
            };

            fetchKey();
            hasFetchedKey.current = true;
        }
    }, []);

    const handleConfirm = () => {
        // User has confirmed they saved the key, so navigate them to their wallet
        navigate('/wallet');
    };

    if (error) {
        return <div><p style={{ color: 'red' }}>{error}</p></div>;
    }

    return (
        <div className="reveal-key-container">
            <h2>🚨 Your Secret Private Key 🚨</h2>
            <p>Write this down and store it in a secure location. **We will never show this to you again.** If you lose it, your funds will be lost forever.</p>
            
            <div className="private-key-display">
                <code>{privateKey || 'Loading...'}</code>
            </div>

            <button onClick={handleConfirm} disabled={!privateKey}>
                I Have Saved My Key, Continue to My Wallet
            </button>
        </div>
    );
}

export default RevealKey;