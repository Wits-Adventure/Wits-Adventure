import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './components/homepage';
import Login from './components/login';
import Signup from './components/signup';
import Success from './components/success';
import { AuthProvider } from './context/AuthContext';
import Home from './components/Home.js'; // Import the Home component
import ProtectedRoute from './components/protectedRoute'; // Import ProtectedRoute
import Unauthorized from './components/unauthorized'; // You'll need to create this component
import StudentHomepage from './components/studentHomepage';
import AdminDashboard from './components/adminDashboard';

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
                <StudentHomepage /> {/* Create this component */}
              </ProtectedRoute>
            } 
          />

          {/* Example: A route only for 'admin' role */}
          <Route 
            path="/admin-panel" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard /> {/* Create this component */}
              </ProtectedRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;