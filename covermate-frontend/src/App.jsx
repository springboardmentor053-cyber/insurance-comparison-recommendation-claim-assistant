import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import RiskProfile from './pages/RiskProfile';
import Policies from './pages/Policies';
import Recommendations from './pages/Recommendations';
import Quote from './pages/Quote';
import Compare from './pages/Compare';
import MyPolicies from './pages/MyPolicies';
import MyClaims from './pages/MyClaims';
import FileClaim from './pages/FileClaim';
import PremiumCalculator from './pages/PremiumCalculator';
import AdminDashboard from './pages/AdminDashboard';

// Wrapper so we can use useLocation inside BrowserRouter
function AppLayout() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <>
      {!hideNavbar && <Navbar />}

      <Routes>

        {/* ───────── Public Routes ───────── */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ───────── Protected Routes ───────── */}

        <Route path="/" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        <Route path="/preferences" element={
          <ProtectedRoute><RiskProfile /></ProtectedRoute>
        } />

        <Route path="/policies" element={
          <ProtectedRoute><Policies /></ProtectedRoute>
        } />

        <Route path="/recommendations" element={
          <ProtectedRoute><Recommendations /></ProtectedRoute>
        } />

        <Route path="/quote" element={
          <ProtectedRoute><Quote /></ProtectedRoute>
        } />

        <Route path="/calculator" element={
          <ProtectedRoute><PremiumCalculator /></ProtectedRoute>
        } />

        <Route path="/compare" element={
          <ProtectedRoute><Compare /></ProtectedRoute>
        } />

        <Route path="/my-policies" element={
          <ProtectedRoute><MyPolicies /></ProtectedRoute>
        } />

        {/* ───────── Claims Routes ───────── */}

        <Route path="/claims" element={
          <ProtectedRoute><MyClaims /></ProtectedRoute>
        } />

        <Route path="/claims/file" element={
          <ProtectedRoute><FileClaim /></ProtectedRoute>
        } />

        {/* ───────── Admin Routes ───────── */}

        <Route path="/admin" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}