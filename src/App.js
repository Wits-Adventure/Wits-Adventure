import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './react_components/homepage.js';
import Login from './react_components/login.js';
import Signup from './react_components/signup.js';
import Success from './react_components/success.js';
import { AuthProvider } from './context/AuthContext';
import Home from './react_components/Home.js'; // Import the Home component
import ProtectedRoute from './react_components/protectedRoute.js'; // Import ProtectedRoute
import Unauthorized from './react_components/unauthorized.js'; // You'll need to create this component
import ProfilePage from './react_components/ProfilePage.js';
import LeaderBoardAchievements from './react_components/LeaderboardAchievements.js'
import AdminDashboard from './react_components/adminDashboard.js';
import QuestBook from './react_components/QuestBook.js';
import Tutorial from './react_components/TutorialPage.js';
import EtherealStyles from './react_components/EtherealStyles.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <>
          <ToastContainer position="top-center" autoClose={2500} />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/Homepage" element={<HomePage />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Signup" element={<Signup />} />
            <Route path="/LeaderBoardAchievements" element={<LeaderBoardAchievements />} />
            <Route path="/Tutorial" element={<EtherealStyles><Tutorial /></EtherealStyles>} />
            <Route path="/unauthorized" element={<Unauthorized />} />


            {/* Protected Routes (Authenticated users only) */}
            <Route
              path="/Success"
              element={
                <ProtectedRoute>
                  <Success />
                </ProtectedRoute>
              }
            />

            {/* Role-Based Protected Routes */}
            <Route
              path="/ProfilePage"
              element={
                <ProtectedRoute requiredRole="student">
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/questbook" element={
                <ProtectedRoute requiredRole="student">
                  <QuestBook />
                </ProtectedRoute>
              }
            />


            <Route
              path="/Admin_Dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/*Catch all route, for invalid paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </>
      </AuthProvider>
    </Router>
  );
};

export default App;
