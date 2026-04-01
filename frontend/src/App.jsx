
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import PolicyList from './components/PolicyList';
import Dashboard from './components/Dashboard';
import ComparePolicies from './components/ComparePolicies';
import PremiumCalculator from './components/PremiumCalculator';
import Sidebar from './components/Sidebar';
import MyPolicies from './components/MyPolicies';
import MyClaims from './components/MyClaims';
import ClaimWizard from './components/ClaimWizard';
import AdminDashboard from './components/AdminDashboard';
import AdminClaims from './components/AdminClaims';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const HomeRoute = () => {
  const { user } = useAuth();
  if (user?.is_admin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Dashboard />;
};

import { useState } from 'react';
import Profile from './components/Profile';
import PolicyDetails from './components/PolicyDetails';

// ... (imports remain)

// Main Layout Component for authenticated users (With Sidebar)
const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex" onClick={() => isDropdownOpen && setIsDropdownOpen(false)}>
      <Sidebar />

      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <header className="bg-white shadow h-16 flex items-center justify-between px-6 sticky top-0 z-50">
          <h1 className="text-xl font-semibold text-gray-800">
            Insurance Assistant
          </h1>

          <div className="relative">
            <button
              className="flex items-center gap-4 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors focus:outline-none"
              onClick={(e) => {
                e.stopPropagation();
                setIsDropdownOpen(!isDropdownOpen);
              }}
            >
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 transform origin-top-right transition-all animate-fadeIn">
                <div className="px-4 py-3 border-b border-gray-100 md:hidden">
                  <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>

                <a
                  href="/profile"
                  className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  View Profile
                </a>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Log Out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<HomeRoute />} />
                    <Route path="/policies" element={<PolicyList />} />
                    <Route path="/policies/:id" element={<PolicyDetails />} />
                    <Route path="/compare" element={<ComparePolicies />} />
                    <Route path="/calculator" element={<PremiumCalculator />} />
                    <Route path="/profile" element={<Profile />} />
                    
                    {/* User Policy and Claim Routes */}
                    <Route path="/policies/my" element={<MyPolicies />} />
                    <Route path="/claims/my" element={<MyClaims />} />
                    <Route path="/claims/file" element={<ClaimWizard />} />
                    <Route path="/claims/:id/edit" element={<ClaimWizard />} />

                    {/* Admin Routes */}
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/claims" element={<AdminClaims />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
