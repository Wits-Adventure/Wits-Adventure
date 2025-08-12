import React from 'react';
import { Link } from 'react-router-dom';

function AdminDashboard() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Dashboard</h2>
        <p style={styles.message}>Manage the application and its users.</p>
        <div style={styles.buttonGroup}>
          <Link to="/Homepage" style={styles.link}>
            <button style={styles.button}>Go to Homepage</button>
          </Link>
          <Link to="/manageUsers" style={styles.link}>
            <button style={styles.button}>Manage Users</button>
          </Link>
          <Link to="/manageQuests" style={styles.link}>
            <button style={styles.button}>Manage Quests</button>
          </Link>
          <Link to="/logout" style={styles.link}>
            <button style={{ ...styles.button, backgroundColor: '#dc3545' }}>Logout</button>
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif',
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '450px',
    textAlign: 'center',
  },
  title: {
    fontSize: '2rem',
    marginBottom: '10px',
  },
  message: {
    fontSize: '1.2rem',
    marginBottom: '30px',
    color: '#555',
  },
  buttonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  link: {
    textDecoration: 'none',
  },
  button: {
    width: '100%',
    padding: '15px',
    fontSize: '1rem',
    color: 'white',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
  }
};

export default AdminDashboard;