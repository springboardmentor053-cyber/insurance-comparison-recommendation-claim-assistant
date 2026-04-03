import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { Shield } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ClaimWizard from './pages/ClaimWizard';
import AdminDashboard from './pages/AdminDashboard';
import AdminManageClaims from './pages/AdminManageClaims';
import ProfilePreferences from './pages/ProfilePreferences';
import BrowsePolicies from './pages/BrowsePolicies';

const Navbar = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <Shield size={28} /> InsurPlus
      </Link>
      <div className="nav-links">
        {user ? (
          <>
            {!user.is_admin ? (
              <>
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
                <Link to="/policies" className="nav-link">Browse Policies</Link>
                <Link to="/file-claim" className="nav-link">File Claim</Link>
                <Link to="/profile" className="nav-link text-emerald-400">Profile</Link>
              </>
            ) : (
              <Link to="/admin" className="nav-link text-warning">Dashboard</Link>
            )}
            <button className="btn btn-secondary" onClick={logout}>Logout ({user.full_name})</button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/signup" className="btn btn-primary">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-center text-xl">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/file-claim" element={
            <PrivateRoute><ClaimWizard /></PrivateRoute>
          } />
          <Route path="/policies" element={
            <PrivateRoute><BrowsePolicies /></PrivateRoute>
          } />
          <Route path="/profile" element={
            <PrivateRoute><ProfilePreferences /></PrivateRoute>
          } />
          <Route path="/admin" element={
            <PrivateRoute><AdminDashboard /></PrivateRoute>
          } />
          <Route path="/admin/manage-claims" element={
            <PrivateRoute><AdminManageClaims /></PrivateRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
