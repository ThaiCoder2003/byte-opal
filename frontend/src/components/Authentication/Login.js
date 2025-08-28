import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../../services/api'; // Adjust the import path as necessary

const Login = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate(); // 2. Initialize the hook

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await api.post('/auth/login', { email, password });
            onLogin(response.data.walletAddress); // Call the onLogin prop with the wallet address

            navigate('/wallet'); // 3. Navigate to the wallet page
        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.error);
            } else {
                setError('An error occurred while logging in.');
            }
        }
    }

      return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br/>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br/>
        <button type="submit">Login</button>

        <p style={{ marginTop: '1rem' }}>
            No wallet yet? <Link to="/register">Register here</Link>
        </p>
      </form>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}

export default Login;