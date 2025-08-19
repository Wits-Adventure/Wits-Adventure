import React from 'react';
import { Link } from 'react-router-dom';

function StudentHomepage() {
  return (
    <main style={styles.container}>
      <section style={styles.card}>
        <h2 style={styles.title}>Welcome, Student!</h2>
        <p style={styles.message}>Choose an action below:</p>
        <section style={styles.buttonGroup}>
          <Link to="/Homepage" style={styles.link}>
            <button style={styles.button}>Go to Homepage</button>
          </Link>
          <Link to="/createQuest" style={styles.link}>
            <button style={styles.button}>Create Quest</button>
          </Link>
          <Link to="/viewQuests" style={styles.link}>
            <button style={styles.button}>View Quests</button>
          </Link>
        </section>
      </section>
    </main>
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

export default StudentHomepage;