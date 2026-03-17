import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import "./navbar.css";

function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoggedIn(false);
      setIsAdmin(false);
      return;
    }

    setIsLoggedIn(true);

    axios
      .get("http://127.0.0.1:8000/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setIsAdmin(res.data.is_admin === true);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("admin_token");
        setIsLoggedIn(false);
        setIsAdmin(false);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin_token");
    setIsLoggedIn(false);
    setIsAdmin(false);
    // Admin goes back to admin login, user goes to regular login
    navigate(isAdmin ? "/admin/login" : "/login");
  };

  return (
    <nav className={`navbar ${isAdmin ? "navbar-admin" : ""}`}>

      {/* Logo */}
      <div className="logo">
        <div className="logo-icon">🛡️</div>
        <span>Cover<span className="logo-accent">Mate</span></span>
      </div>

      <div className="nav-links">

        {/* ── ADMIN navbar — only dashboard + logout ── */}
        {isLoggedIn && isAdmin ? (
          <>
            <span style={{
              fontSize: "12px",
              fontWeight: "600",
              background: "rgba(255,255,255,0.15)",
              padding: "4px 10px",
              borderRadius: "20px",
              letterSpacing: "0.8px",
              color: "rgba(255,255,255,0.9)",
            }}>
              ADMIN
            </span>
            <Link to="/admin">Dashboard</Link>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (

          /* ── USER navbar — full navigation ── */
          <>
            <Link to="/">Home</Link>
            <Link to="/policies">Policies</Link>
            <Link to="/my-policies">My Policies</Link>

            {isLoggedIn ? (
              <>
                <Link to="/profile">Profile</Link>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </>
        )}
      </div>

    </nav>
  );
}

export default Navbar;