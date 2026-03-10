import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        setDropdownOpen(false);
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setDropdownOpen(false);
    }, [location.pathname]);

    if (!isAuthenticated) return null;

    const mainLinks = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/policies', label: 'Policies', icon: '📋' },
    { path: '/recommendations', label: 'Recommendations', icon: '⭐' },
    { path: '/my-policies', label: 'My Policies', icon: '🛡️' }, // ✅ ADD THIS
];


    return (
        <nav
            className="glass-card"
            style={{
                margin: '1rem 1.5rem 0',
                padding: '0.75rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                position: 'relative',
                zIndex: 50,
            }}
        >
            {/* Left Side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                {/* Logo */}
                <Link
                    to="/"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        textDecoration: 'none',
                        flexShrink: 0,
                    }}
                >
                    <img
                        src="/logo.png"
                        alt="CoverMate"
                        style={{ height: '2.25rem', width: 'auto' }}
                    />
                    <span
                        className="gradient-text hidden sm:inline"
                        style={{
                            fontSize: '1.125rem',
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                        }}
                    >
                        CoverMate
                    </span>
                </Link>

                {/* Navigation Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {mainLinks.map((link) => {
                        const isActive = location.pathname === link.path;
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.625rem',
                                    fontSize: '0.8125rem',
                                    fontWeight: isActive ? 600 : 500,
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    background: isActive
                                        ? 'rgba(99, 102, 241, 0.12)'
                                        : 'transparent',
                                    color: isActive ? '#a5b4fc' : '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem',
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background =
                                            'rgba(148, 163, 184, 0.06)';
                                        e.currentTarget.style.color = '#e2e8f0';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                        e.currentTarget.style.color = '#94a3b8';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '0.875rem' }}>
                                    {link.icon}
                                </span>
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Right Side - Profile */}
            <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: dropdownOpen
                            ? 'rgba(99, 102, 241, 0.08)'
                            : 'transparent',
                        border: '1px solid',
                        borderColor: dropdownOpen
                            ? 'rgba(99, 102, 241, 0.2)'
                            : 'transparent',
                        borderRadius: '0.75rem',
                        padding: '0.375rem 0.75rem 0.375rem 0.375rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div
                        style={{
                            width: '2rem',
                            height: '2rem',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'white',
                            background:
                                'linear-gradient(135deg, #6366f1, #06b6d4)',
                        }}
                    >
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>

                    <span
                        className="hidden md:inline"
                        style={{
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            color: '#e2e8f0',
                        }}
                    >
                        {user?.name?.split(' ')[0]}
                    </span>
                </button>

                {dropdownOpen && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 'calc(100% + 0.5rem)',
                            right: 0,
                            width: '14rem',
                            background: 'rgba(30, 41, 59, 0.95)',
                            borderRadius: '0.875rem',
                            padding: '0.5rem',
                            zIndex: 100,
                        }}
                    >
                        <Link to="/profile" style={{ display: 'block', padding: '0.5rem', color: '#cbd5e1' }}>
                            👤 My Profile
                        </Link>
                        <Link to="/preferences" style={{ display: 'block', padding: '0.5rem', color: '#cbd5e1' }}>
                            ⚙️ Preferences
                        </Link>
                        <button
                            onClick={handleLogout}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                marginTop: '0.5rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#f87171',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            🚪 Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
}
