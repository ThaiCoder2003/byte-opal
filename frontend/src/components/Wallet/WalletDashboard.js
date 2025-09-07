import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api'; // Your centralized api service

// A helper function to format the transaction display
const TransactionItem = ({ tx }) => {
    const isReceive = tx.type === 'receive';
    // Your renderCounterparty helper function can be simplified now
    // as the data structure is clear.
    const counterpartyDisplay = tx.counterparty === 'Mining Reward' 
        ? tx.counterparty 
        : `${tx.counterparty.substring(0, 10)}...`;

    return (
        <tr className={isReceive ? 'tx-receive' : 'tx-send'}>
            <td><Link to={`/tx/${tx.hash}`}>{`${tx.hash.substring(0, 10)}...`}</Link></td>
            <td>{tx.type}</td>
            <td><Link to={`/address/${tx.counterparty}`}>{counterpartyDisplay}</Link></td>
            <td>{tx.amount}</td>
            <td><span className={`status-${tx.status}`}>{tx.status}</span></td>
        </tr>
    );
};

const WalletDashboard = ({ user }) => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return; // Don't fetch if user is not logged in

            try {
                setLoading(true);
                // Fetch balance and history at the same time
                const [balanceRes, historyRes] = await Promise.all([
                    api.get('/wallet/balance'),
                    api.get('/wallet/history')
                ]);

                setBalance(balanceRes.data.balance);
                setTransactions(historyRes.data.transactions);

                                // --- ADD THIS LINE ---
                console.log('DATA FROM API:', historyRes.data.transactions);

                setError('');
            } catch (err) {
                setError('Failed to fetch wallet data.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]); // Re-fetch data if the user prop changes

    if (loading) {
        return <div>Loading your wallet...</div>;
    }

    if (error) {
        return <div style={{ color: 'red' }}>{error}</div>;
    }

    return (
        <div className="wallet-dashboard">
            <h2>Your Wallet</h2>
            
            <div className="wallet-summary">
                <div className="wallet-address">
                    <strong>Your Address:</strong> <code>{user.address}</code>
                </div>
                <div className="wallet-balance">
                    <strong>Balance:</strong> <span>{balance} ByteOpal</span>
                </div>
            </div>

            <div className="wallet-actions">
                <Link to="/send-transaction" className="action-button">Send</Link>
                <Link to="/mine" className="action-button">Mine</Link>
            </div>

            <h3>Transaction History</h3>
            <div className="transaction-history">
                <table>
                    <thead>
                        <tr>
                            <th>Hash</th>
                            <th>Type</th>
                            <th>Counterparty</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length > 0 ? (
                            transactions.map(tx => <TransactionItem key={tx.hash} tx={tx} />)
                        ) : (
                            <tr>
                                <td colSpan="5">No transactions yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default WalletDashboard;