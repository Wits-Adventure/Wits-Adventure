import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signupNormUser } from '../firebase/firebase';
import '../css/Signup.css';
import logoImage from '../media/LOGO_Alpha.png';

function check_email(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return false;
    }
    const domain_name = email.split("@")[1];
    return domain_name === "students.wits.ac.za";
}

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleUsernameChange = (e) => setUsername(e.target.value);
  const handleEmailChange = (e) => setEmail(e.target.value);
  
  const handlePasswordChange = (e) => {
    const newPass = e.target.value;
    setPassword(newPass);

  };

  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    

    if (!check_email(email)) {
      setError('Please use your Wits student email.');
      return;
    }

   
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    signupNormUser({
      Name: username,
      Email: email,
      Password: password,
      ConfirmPassword: confirmPassword,
      Role: 'student',
     
    })
    .then(() => {
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      navigate('/login');
    })
    .catch((error) => {
      setError(error.message);
    });
  };

  return (
    <main className="signup-container">
      <section className="signup-logo">
        <img src={logoImage} alt="Wits Adventure Logo" />
        <h1>WITS ADVENTURE</h1>
      </section>

      <form onSubmit={handleSubmit} className="signup-form">
        <h2 className="signup-title">Create an Account</h2>
        {error && <p className="signup-error">{error}</p>}

        <section className="signup-input-group">
          <label htmlFor="username" className="signup-label">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
            required
            className="signup-input"
            placeholder="Enter your username"
          />
        </section>

        <section className="signup-input-group">
          <label htmlFor="email" className="signup-label">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={handleEmailChange}
            required
            className="signup-input"
            placeholder="your.email@students.wits.ac.za"
          />
        </section>

        <section className="signup-input-group">
          <label htmlFor="password" className="signup-label">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={handlePasswordChange}
            required
            className="signup-input"
            placeholder="Enter your password"
          />
          
        </section>

        <section className="signup-input-group">
          <label htmlFor="confirm-password" className="signup-label">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            className="signup-input"
            placeholder="Confirm your password"
          />
        </section>

        <button type="submit" className="signup-button">Sign Up</button>
        
        <p className="signup-login-text">
          Already have an account? <Link to="/login" className="signup-link">Log in here</Link>
        </p>
      </form>
    </main>
  );
}

export default Signup;
