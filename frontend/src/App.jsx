import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Policies from "./pages/Policies";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedUser = localStorage.getItem("user");
      setUser(storedUser ? JSON.parse(storedUser) : null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#e6edf5] font-sans text-slate-900">
        {/* --- NAVIGATION --- */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/" className="text-2xl font-black tracking-tighter text-blue-600">
                COVERMATE
              </Link>
              <div className="hidden md:flex gap-6 text-[11px] font-black uppercase tracking-widest text-slate-400">
                <Link to="/" className="hover:text-blue-600 transition">Catalog</Link>
                <Link to="#" className="opacity-30 cursor-not-allowed">Recommendations</Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm font-bold text-slate-600">
                    Hello <span className="text-blue-600">{user.name}</span> !
                  </span>
                  <button 
                    onClick={handleLogout}
                    className="px-5 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition">
                    Log In
                  </Link>
                  <Link to="/register" className="px-6 py-2.5 text-sm font-black bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition shadow-lg shadow-slate-200">
                    Register Now 
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* --- MAIN CONTENT --- */}
        <main className="max-w-7xl mx-auto py-12">
          <Routes>
            <Route path="/" element={<Policies />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>

        {/* --- FOOTER --- */}
        <footer className="border-t border-slate-200/50 bg-white/80 backdrop-blur-sm py-10 mt-20">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              © 2026 COVERMATE • Foundations
            </p>
            <div className="flex gap-4">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;