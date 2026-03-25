import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dob, setDob] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { saveTokensAndLoadUser } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const tokens = await register(name, email, password, dob || null);
            await saveTokensAndLoadUser(tokens);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.');
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
                    top: '5%',
                    right: '5%',
                    width: '22rem',
                    height: '22rem',
                    background: 'rgba(99,102,241,0.06)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                }}
            />
            <div
                style={{
                    position: 'fixed',
                    bottom: '5%',
                    left: '5%',
                    width: '18rem',
                    height: '18rem',
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
                <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
                    <img src="/logo.png" alt="CoverMate" style={{ height: '4rem', marginBottom: '0.5rem' }} />
                    <h1
                        className="gradient-text"
                        style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}
                    >
                        Create Account
                    </h1>
                    <p style={{ color: '#94a3b8', marginTop: '0.5rem', fontSize: '0.9375rem' }}>
                        Join CoverMate and get covered
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
                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="label" htmlFor="name">Full Name</label>
                        <input
                            id="name"
                            type="text"
                            className="input-field"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="label" htmlFor="reg-email">Email Address</label>
                        <input
                            id="reg-email"
                            type="email"
                            className="input-field"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label className="label" htmlFor="reg-password">Password</label>
                        <input
                            id="reg-password"
                            type="password"
                            className="input-field"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label className="label" htmlFor="dob">Date of Birth</label>
                        <input
                            id="dob"
                            type="date"
                            className="input-field"
                            value={dob}
                            onChange={(e) => setDob(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                {/* Footer */}
                <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '2rem' }}>
                    Already have an account?{' '}
                    <Link
                        to="/login"
                        style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#a5b4fc')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#818cf8')}
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
