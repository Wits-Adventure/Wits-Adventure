// src/components/ProtectedRoute.js
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserData } from '../firebase/firebase'; // Assuming you have a function to get user data

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (currentUser) {
        try {
          const userData = await getUserData(currentUser.uid); // Pass the user ID to getUserData
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
  return <div style={{ textAlign: 'center' }}><img src={process.env.PUBLIC_URL + '/loading.gif'} alt="Loading..." style={{ width: 60, height: 60 }} /></div>; // Loading spinner
  }

  if (!currentUser) {
    // If no user is logged in, redirect to login
    return <Navigate to="/login" />;
  }

  // If a requiredRole is specified, check if the user has that role
  if (requiredRole && userRole !== requiredRole) {
    // If the user's role does not match the required role, redirect to an unauthorized page or dashboard
    return <Navigate to="/unauthorized" />; 
  }

  // If the user is authenticated and has the correct role (or no role is required), render the children
  return children;
};

export default ProtectedRoute;