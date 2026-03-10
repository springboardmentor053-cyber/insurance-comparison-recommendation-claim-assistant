import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import RiskProfile from './pages/RiskProfile';
import Policies from './pages/Policies';
import Recommendations from './pages/Recommendations';
import Quote from './pages/Quote';
import Compare from './pages/Compare';   // ✅ ADD THIS
import MyPolicies from "./pages/MyPolicies";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />

        <Routes>

          {/* ───────── Public Routes ───────── */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ───────── Protected Routes ───────── */}

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <RiskProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/policies"
            element={
              <ProtectedRoute>
                <Policies />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recommendations"
            element={
              <ProtectedRoute>
                <Recommendations />
              </ProtectedRoute>
            }
          />

          {/* ✅ Quote Page */}
          <Route
            path="/quote"
            element={
              <ProtectedRoute>
                <Quote />
              </ProtectedRoute>
            }
          />

          {/* ✅ Compare Page */}
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <Compare />
              </ProtectedRoute>
            }
          />
          <Route
  path="/my-policies"
  element={
    <ProtectedRoute>
      <MyPolicies />
    </ProtectedRoute>
  }
/>


          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

      </AuthProvider>
    </BrowserRouter>
  );
}
