import React, { useState } from 'react';
import '../Home.css';
import logoImage from '../media/LOGO_Alpha.png';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  // Mock login function - replace with actual authentication
  const handleLogin = () => {
    setIsLoggedIn(true);
    setUsername('JohnDoe'); // Replace with actual username from auth
  };

  // Mock logout function
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUsername('');
  };

  return (
    <section className="home-container">
      {/* Header */}
      <header className="header">
        {/* Website Name with Logo */}
        <section className="website-name">
          <img src={logoImage} alt="Logo" className="logo" />
          <h1>WITS ADVENTURE</h1>
        </section>

        {/* User Profile Area */}
        <section className="user-area">
          {isLoggedIn ? (
            <section className="user-profile">
              <section className="profile-icon">
                {username.charAt(0).toUpperCase()}
              </section>
              <span className="username">{username}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </section>
          ) : (
            <section className="auth-buttons">
              <button className="signup-btn">Sign Up</button>
              <button className="login-btn" onClick={handleLogin}>
                Login
              </button>
            </section>
          )}
        </section>
      </header>

      {/* Map Container */}
      <main className="map-section">
        <section className="map-container">
          <section className="map-content">
            <h2 className="map-title">MAP</h2>
            {/* Map image will be set as background in CSS */}
          </section>
        </section>
      </main>

      {/* Optional: Bottom navigation or footer */}
      <section className="bottom-nav">
        <button className="nav-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 10L12 3L19 10L19 20H5V10Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </section>
    </section>
  );
};

export default Home;