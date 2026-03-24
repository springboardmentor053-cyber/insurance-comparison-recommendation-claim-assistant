import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./navbar.css";

function Navbar() {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminPath = location.pathname.startsWith("/admin");

  useEffect(() => {
    const adminToken = localStorage.getItem("admin_token");
    const userToken = localStorage.getItem("token");
    setIsAdminLoggedIn(!!adminToken);
    setIsUserLoggedIn(!!userToken);
    setMenuOpen(false); // close menu on route change
  }, [location.pathname]);

  const handleLogout = () => {
    if (isAdminPath) {
      localStorage.removeItem("admin_token");
      setIsAdminLoggedIn(false);
      navigate("/admin/login");
    } else {
      localStorage.removeItem("token");
      setIsUserLoggedIn(false);
      navigate("/login");
    }
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  // ── Admin navbar ──────────────────────────────────────────
  if (isAdminPath) {
    return (
      <nav className="navbar navbar-admin">
        <div className="logo">
          <div className="logo-icon">🛡️</div>
          <span>Cover<span className="logo-accent">Mate</span></span>
        </div>

        {isAdminLoggedIn && (
          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        )}

        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          {isAdminLoggedIn ? (
            <>
              <span style={{
                fontSize: "12px", fontWeight: "600",
                background: "rgba(255,255,255,0.15)",
                padding: "4px 10px", borderRadius: "20px",
                letterSpacing: "0.8px", color: "rgba(255,255,255,0.9)",
              }}>
                ADMIN
              </span>
              <Link to="/admin" onClick={closeMenu}>Dashboard</Link>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>
              Administration Portal
            </span>
          )}
        </div>
      </nav>
    );
  }

  // ── User navbar ───────────────────────────────────────────
  return (
    <nav className="navbar">
      <div className="logo">
        <div className="logo-icon">🛡️</div>
        <span>Cover<span className="logo-accent">Mate</span></span>
      </div>

      {/* Hamburger button */}
      <button
        className={`hamburger ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span></span><span></span><span></span>
      </button>

      <div className={`nav-links ${menuOpen ? "open" : ""}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/policies" onClick={closeMenu}>Policies</Link>
        <Link to="/my-policies" onClick={closeMenu}>My Policies</Link>

        {isUserLoggedIn ? (
          <>
            <Link to="/profile" onClick={closeMenu}>Profile</Link>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={closeMenu}>Login</Link>
            <Link to="/register" onClick={closeMenu}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;