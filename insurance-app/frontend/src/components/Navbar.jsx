import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="text-2xl font-extrabold flex items-center gap-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:rotate-6 transition-transform">
            <span className="text-white text-xl">🛡️</span>
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">InsuranceAssist</span>
        </Link>
        
        <div className="flex gap-8 items-center">
          <Link to="/policies" className="text-slate-600 hover:text-blue-600 font-semibold transition-colors">Browse Policies</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 font-semibold transition-colors">Dashboard</Link>
              {user.is_admin && (
                <Link to="/admin" className="text-orange-600 hover:text-orange-700 font-semibold transition-colors">Admin Panel</Link>
              )}
              <div className="flex items-center gap-4 ml-6 pl-6 border-l border-slate-200">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Welcome back</span>
                  <span className="text-sm font-bold text-slate-900">{user.full_name.split(' ')[0]}</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                  title="Logout"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="Refined Logout Icon" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="px-5 py-2.5 text-slate-600 hover:text-blue-600 font-bold transition-colors">Log in</Link>
              <Link to="/login?signup=true" className="btn-primary">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
