import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);
    const { saveTokensAndLoadUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const tokens = await login(email, password);
            await saveTokensAndLoadUser(tokens);
            // AuthContext stores user — check role after load
            const me = JSON.parse(atob(tokens.access_token.split('.')[1]));
            // Fetch actual role from /auth/me via context
            // Then redirect — AdminRoute in App.jsx handles role check
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0a28 50%, #0a0a1a 100%)',
                padding: '2rem 1rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative blobs */}
            <div style={{ position:'fixed', top:'5%', left:'5%', width:'22rem', height:'22rem',
                background:'rgba(220,38,38,0.06)', borderRadius:'50%', filter:'blur(90px)', pointerEvents:'none' }} />
            <div style={{ position:'fixed', bottom:'8%', right:'8%', width:'20rem', height:'20rem',
                background:'rgba(239,68,68,0.04)', borderRadius:'50%', filter:'blur(80px)', pointerEvents:'none' }} />

            <div
                className="animate-fade-in-up"
                style={{
                    width: '100%', maxWidth: '26rem',
                    background: 'rgba(20, 8, 8, 0.85)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: '1.25rem',
                    padding: '2.5rem',
                    boxShadow: '0 24px 80px rgba(220,38,38,0.12), 0 0 0 1px rgba(220,38,38,0.08)',
                }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    {/* Shield icon */}
                    <div style={{
                        width: '3.5rem', height: '3.5rem', borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(220,38,38,0.2), rgba(239,68,68,0.1))',
                        border: '1px solid rgba(220,38,38,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.5rem', margin: '0 auto 1rem',
                    }}>
                        🛡️
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
                        Admin Portal
                    </h1>
                    <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        Restricted access — authorised staff only
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
                        borderRadius: '0.625rem', padding: '0.875rem 1rem',
                        color: '#f87171', fontSize: '0.875rem', marginBottom: '1.5rem',
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display:'block', fontSize:'0.8125rem', fontWeight:600,
                            color:'#9ca3af', marginBottom:'0.5rem', letterSpacing:'0.04em', textTransform:'uppercase' }}>
                            Admin Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="admin@covermate.com"
                            style={{
                                width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem',
                                border: '1px solid rgba(220,38,38,0.25)',
                                background: 'rgba(220,38,38,0.05)',
                                color: '#f1f5f9', fontSize: '0.9375rem',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.75rem' }}>
                        <label style={{ display:'block', fontSize:'0.8125rem', fontWeight:600,
                            color:'#9ca3af', marginBottom:'0.5rem', letterSpacing:'0.04em', textTransform:'uppercase' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                            style={{
                                width: '100%', padding: '0.75rem 1rem', borderRadius: '0.625rem',
                                border: '1px solid rgba(220,38,38,0.25)',
                                background: 'rgba(220,38,38,0.05)',
                                color: '#f1f5f9', fontSize: '0.9375rem',
                                outline: 'none', boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '0.875rem', borderRadius: '0.75rem',
                            background: loading ? 'rgba(220,38,38,0.4)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                            color: '#fff', fontWeight: 700, fontSize: '0.9375rem',
                            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 16px rgba(220,38,38,0.3)',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {loading ? 'Signing in…' : '🛡️ Access Admin Portal'}
                    </button>
                </form>

                {/* Back link */}
                <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.8125rem', color: '#6b7280' }}>
                    Not an admin?{' '}
                    <Link to="/login" style={{ color: '#f87171', fontWeight: 600, textDecoration: 'none' }}>
                        Customer Login →
                    </Link>
                </p>
            </div>
        </div>
    );
}
