import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, getUserName, getUserRole, getUserData } from '../firebase/firebase';

function Success() {
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [leaderboardPoints, setLeaderboardPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userData = await getUserData();
          setUserName(userData.Name);
          setUserRole(userData.Role);
          setUserEmail(userData.Email);
          setLeaderboardPoints(userData.LeaderBoardPoints || 0); 
        } else {
          // If no user is logged in, redirect to login page
          navigate('/login');
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        // Handle error, maybe redirect to login
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  if (loading) {
    return <div style={styles.container}>Loading...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Login Successful!</h2>
        <div style={styles.userInfo}>
          <p><strong>Name:</strong> {userName}</p>
          <p><strong>Email:</strong> {userEmail}</p>
          <p><strong>Role:</strong> {userRole}</p>
          <p><strong>Leaderboard Points:</strong> {leaderboardPoints}</p>
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
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center',
  },
  title: {
    marginBottom: '20px',
    color: '#333',
  },
  userInfo: {
    textAlign: 'left',
    lineHeight: '1.5',
  },
};

export default Success;