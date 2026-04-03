import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import RiskProfile from './pages/RiskProfile';
import Policies from './pages/Policies';
import Compare from './pages/Compare';
import Quote from './pages/Quote';
import MyPolicies from './pages/MyPolicies';
import Recommendations from './pages/Recommendations';
import Claims from './pages/Claims';
import ClaimFilingWizard from './pages/ClaimFilingWizard';
import ClaimDetails from './pages/ClaimDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminClaims from './pages/AdminClaims';
import AdminFraudFlags from './pages/AdminFraudFlags';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminLogin from './pages/AdminLogin';
import VehicleLookup from './pages/VehicleLookup';
import NetworkLocator from './pages/NetworkLocator';

// Guard: only allows users with role === 'admin'
function AdminRoute({ children }) {
    const { user, isAuthenticated } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (user?.role !== 'admin') return <Navigate to="/" replace />;
    return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/preferences" element={<ProtectedRoute><RiskProfile /></ProtectedRoute>} />
          <Route path="/policies" element={<ProtectedRoute><Policies /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><Compare /></ProtectedRoute>} />
          <Route path="/quote" element={<ProtectedRoute><Quote /></ProtectedRoute>} />
          <Route path="/my-policies" element={<ProtectedRoute><MyPolicies /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/claims" element={<ProtectedRoute><Claims /></ProtectedRoute>} />
          <Route path="/claims/new" element={<ProtectedRoute><ClaimFilingWizard /></ProtectedRoute>} />
          <Route path="/claims/:id" element={<ProtectedRoute><ClaimDetails /></ProtectedRoute>} />

          {/* Admin-only Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/claims" element={<AdminRoute><AdminClaims /></AdminRoute>} />
          <Route path="/admin/fraud-flags" element={<AdminRoute><AdminFraudFlags /></AdminRoute>} />
          <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />

          {/* Customer feature routes */}
          <Route path="/vehicle" element={<ProtectedRoute><VehicleLookup /></ProtectedRoute>} />
          <Route path="/network" element={<ProtectedRoute><NetworkLocator /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
