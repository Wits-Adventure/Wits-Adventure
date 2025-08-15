import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/homepage.js';
import Login from './pages/login';
import Signup from './pages/signup.js';
import Success from './pages/success.js';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home.js'; // Import the Home component
import ProtectedRoute from './components/protectedRoute'; // Import ProtectedRoute
import Unauthorized from './pages/unauthorized.js'; // You'll need to create this component
import StudentProfile from './pages/studentProfile.js';
import ProfilePage from './pages/ProfilePage.js';
import LeaderBoardAchievements from './pages/LeaderboardAchievements.js'
import AdminDashboard from './pages/adminDashboard.js';

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
