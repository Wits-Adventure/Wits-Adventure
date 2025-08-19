import React from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSignupClick = () => {
    navigate('/signup');
  };

  return (
    <section style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to  Wits Quest</h1>
      <p>Please log in or sign up to continue.</p>
      <button 
        onClick={handleLoginClick} 
        style={{ marginRight: '10px', padding: '10px 20px' }}
      >
        Login
      </button>
      <button 
        onClick={handleSignupClick} 
        style={{ padding: '10px 20px' }}
      >
        Sign Up
      </button>
    </section>
  );
}

export default HomePage;