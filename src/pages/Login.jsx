import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { saveTokensAndLoadUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const tokens = await login(email, password);
            await saveTokensAndLoadUser(tokens);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="gradient-bg"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Decorative blobs */}
            <div
                style={{
                    position: 'fixed',
                    top: '10%',
                    left: '10%',
                    width: '20rem',
                    height: '20rem',
                    background: 'rgba(99,102,241,0.06)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    bottom: '10%',
                    right: '10%',
                    width: '24rem',
                    height: '24rem',
                    background: 'rgba(6,182,212,0.06)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                }}
            />

            <div
                className="glass-card animate-fade-in-up"
                style={{ width: '100%', maxWidth: '26rem', padding: '2.5rem' }}
            >
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <img src="/logo.png" alt="CoverMate" style={{ height: '4rem', marginBottom: '0.5rem' }} />
                    <h1
                        className="gradient-text"
                        style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}
                    >
                        CoverMate
                    </h1>
                    <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
                        Sign in to your account
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="alert-error" style={{ marginBottom: '1.5rem' }}>
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.375rem' }}>
                        <label className="label" htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            className="input-field"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label className="label" htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Footer */}
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '2rem' }}>
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#818cf8')}
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
