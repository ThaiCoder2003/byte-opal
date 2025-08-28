import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import React, { useState, useEffect } from 'react';
import Login from './components/Authentication/Login';
import Register from './components/Authentication/Register';
import RevealKey from './components/Authentication/RevealKey';
import MinePage from './components/Wallet/Mine';
import WalletDashboard from './components/Wallet/WalletDashboard';
import SendTransactionPage from './components/Wallet/SendTransaction';
import Navbar from './components/Navbar';
import api from './services/api';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To handle initial auth check

  const navigate = useNavigate();
  const handleLogin = (walletAddress) => {
    setCurrentUser({ address: walletAddress });
    navigate('/wallet'); // 2. Redirect AFTER the state has been set
  };
  
  const handleLogout = async () => {
    try {
      await api.get('/auth/logout');
      setCurrentUser(null);
      console.log('User logged out successfully');
    } catch (error) {
          console.error('Error during logout:', error);
    }
  };

    useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // We will create this new endpoint in the backend
        const response = await api.get('/auth/status');
        if (response.data && response.data.walletAddress) {
          setCurrentUser({ address: response.data.walletAddress });
        }
      } catch (error) {
        // No valid token found, user is not logged in
        console.log('User not authenticated.');
      } finally {
        setLoading(false); // Stop loading once the check is complete
      }
    };

    checkAuthStatus();
  }, []); // The empty array ensures this runs only once
  if (loading) {
    return <div>Loading Application...</div>;
  }

  return (
    <>
      {/* Navbar receives the current user state and the logout handler */}
      <Navbar user={currentUser} onLogout={handleLogout} />
      
      <div className="container">
        <Routes>
          <Route
            path="/"
            element={<Navigate to={currentUser ? "/wallet" : "/login"} />}
          />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reveal-key" element={<RevealKey />} />
          <Route 
            path="/wallet" 
            element={currentUser ? <WalletDashboard user={currentUser} /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/send-transaction" 
            element={currentUser ? <SendTransactionPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/mine" 
            element={currentUser ? <MinePage /> : <Navigate to="/login" />}
          />
        </Routes>
      </div>
    </>
  );
}

export default App;
