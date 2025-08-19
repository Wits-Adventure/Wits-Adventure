import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginNormUser } from '../firebase/firebase';
import '../css/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await loginNormUser({ email, password });
      console.log('Login attempted with:', { email, password });
      
      // Navigate to the dashboard or home page after successful login
      navigate('/success'); 

      setEmail('');
      setPassword('');

    } catch (error) {
      console.error("Login failed:", error.message);
      setError(error.message); // Set the error state to display to the user
    }
  };

  return (
    <main className="login-container">
      <section className="login-logo">
        <img src="/LOGO_Alpha.png" alt="Wits Adventure Logo" />
        <h1>WITS ADVENTURE</h1>
      </section>

      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">Welcome Back</h2>
        {error && <p className="login-error">{error}</p>}
        
        <section className="login-input-group">
          <label htmlFor="email" className="login-label">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
            className="login-input"
            placeholder="your.email@students.wits.ac.za"
          />
        </section>

        <section className="login-input-group">
          <label htmlFor="password" className="login-label">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            required
            className="login-input"
            placeholder="Enter your password"
          />
        </section>

        <button type="submit" className="login-button">Login</button>
        
        <p className="login-signup-text">
          Don't have an account? <Link to="/signup" className="login-link">Sign up here</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;