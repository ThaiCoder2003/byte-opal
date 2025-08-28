import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

// A simple function to shorten a long wallet address for display
const shortenAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    // Call the onLogout function passed from the parent App component
    onLogout();
    // Redirect to the login page after logout
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        ByteOpal Explorer
      </Link>
      
      <div className="navbar-links">
        {user ? (
          // --- RENDER THIS IF A USER IS LOGGED IN ---
          <>
            <span className="navbar-user">
              Welcome, {shortenAddress(user.address)}
            </span>
            <Link to="/wallet">My Wallet</Link>
            <button onClick={handleLogoutClick} className="logout-button">
              Logout
            </button>
          </>
        ) : (
          // --- RENDER THIS IF NO USER IS LOGGED IN ---
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;