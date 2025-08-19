import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './react_components/homepage.js';
import Login from './react_components/login.js';
import Signup from './react_components/signup.js';
import Success from './react_components/success.js';
import { AuthProvider } from './context/AuthContext';
import Home from './react_components/Home.js'; // Import the Home component
import ProtectedRoute from './react_components/protectedRoute.js'; // Import ProtectedRoute
import Unauthorized from './react_components/unauthorized.js'; // You'll need to create this component
import StudentProfile from './react_components/studentProfile.js';
import ProfilePage from './react_components/ProfilePage.js';
import LeaderBoardAchievements from './react_components/LeaderboardAchievements.js'
import AdminDashboard from './react_components/adminDashboard.js';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/Homepage" element={<HomePage />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/LeaderBoardAchievements" element={<LeaderBoardAchievements />} />
          <Route path="/ProfilePage" element={<ProfilePage />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/questbook" element={<QuestBook />} />
        
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
          {/* Example: A route only for 'student' role */}
          <Route 
            path="/student-homepage" 
            element={
              <ProtectedRoute requiredRole="student">
                <StudentProfile /> 
              </ProtectedRoute>
            } 
          />

          {/* Example: A route only for 'admin' role */}
          <Route 
            path="/admin-panel" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard /> 
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;
