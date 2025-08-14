import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../firebase/firebase';

function Unauthorized() {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userData = await getUserData();
          setUserRole(userData.Role);
        } catch (error) {
          console.error("Failed to fetch user role:", error);
          setUserRole(null);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [currentUser]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  const userHomepageLink = userRole === 'student' ? '/student-homepage' : '/admin-dashboard';
  const homepageText = userRole === 'student' ? 'Go to your Student homepage' : 'Go to your Admin homepage';

  return (
    <main style={styles.container}>
      <section style={styles.content}>
        <h1 style={styles.title}>403 - Unauthorized Access</h1>
        <p style={styles.message}>
          You do not have permission to view this page.
        </p>
        <section style={styles.linkGroup}>
          <Link to={userHomepageLink} style={styles.link}>
            {homepageText}
          </Link>
          <span style={{ color: '#ccc' }}>|</span>
          <Link to="/" style={styles.link}>
            Go back to the standard homepage
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
  content: {
    textAlign: 'center',
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: '2.5rem',
    color: '#d9534f',
    marginBottom: '10px',
  },
  message: {
    fontSize: '1.2rem',
    marginBottom: '20px',
  },
  linkGroup: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    marginTop: '20px',
  },
  link: {
    fontSize: '1rem',
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};

export default Unauthorized;