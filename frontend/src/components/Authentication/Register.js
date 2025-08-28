import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../../services/api'; // Adjust the import path as necessary

const Register = ({ onRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async(e) => {
      e.preventDefault();
      setError('');

      try {
          await api.post(
              '/auth/register',
              { email, password, confirmPassword },
          );

          navigate('/reveal-key');
      }
      catch (err) {
          if (err.response && err.response.data?.error) {
              setError(err.response.data.error);
          } else {
              setError('Registration failed.');
          }
      }
  }

  return (
      <div className="register-container">
          <h2>Register</h2>
          <form onSubmit={handleRegister}>
              <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
              />
              <br />
              <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
              />
              <br />
              <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
              />
              <br />
              <button type="submit">Register</button>
              <p style={{ marginTop: '1rem' }}>
                  Already have a wallet? <Link to="/login">Log in here</Link>
              </p>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
  );
}

export default Register;
