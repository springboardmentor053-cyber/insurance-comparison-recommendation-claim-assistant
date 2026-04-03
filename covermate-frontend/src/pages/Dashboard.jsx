import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyClaims } from '../services/claimService';

export default function Dashboard() {
    const { user } = useAuth();
    const [openClaimsCount, setOpenClaimsCount] = useState(0);

    useEffect(() => {
        getMyClaims()
            .then(claims => {
                const active = claims.filter(c => !['approved', 'rejected', 'paid'].includes(c.status));
                setOpenClaimsCount(active.length);
            })
            .catch(() => {});
    }, []);

    const stats = [
        { label: 'Active Policies', value: '—', icon: '🛡️', color: '#7c3aed' },
        { label: 'Open Claims', value: openClaimsCount.toString(), icon: '📝', color: '#3b82f6' },
        { label: 'Recommendations', value: '—', icon: '⭐', color: '#f97316' },
    ];

    const quickLinks = [
        {
            title: 'My Profile',
            desc: 'View and edit your personal information',
            icon: '👤',
            path: '/profile',
            gradient: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(124,58,237,0.04) 100%)',
            hoverBorder: 'rgba(124,58,237,0.3)',
        },
        {
            title: 'Preferences',
            desc: 'Set your insurance preferences & risk profile',
            icon: '⚙️',
            path: '/preferences',
            gradient: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.04) 100%)',
            hoverBorder: 'rgba(59,130,246,0.3)',
        },
        {
            title: 'Browse Policies',
            desc: 'Compare insurance plans from top insurers',
            icon: '📋',
            path: '/policies',
            gradient: 'linear-gradient(135deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.04) 100%)',
            hoverBorder: 'rgba(34,197,94,0.3)',
        },
        {
            title: 'My Policies',
            desc: 'View and manage your enrolled insurance policies',
            icon: '🛡️',
            path: '/my-policies',
            gradient: 'linear-gradient(135deg, rgba(167,139,250,0.12) 0%, rgba(167,139,250,0.04) 100%)',
            hoverBorder: 'rgba(167,139,250,0.3)',
        },
        {
            title: 'Recommendations',
            desc: 'Personalized policy suggestions based on your profile',
            icon: '⭐',
            path: '/recommendations',
            gradient: 'linear-gradient(135deg, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0.04) 100%)',
            hoverBorder: 'rgba(249,115,22,0.3)',
        },
        {
            title: 'My Claims',
            desc: 'File and track your insurance claims',
            icon: '📁',
            path: '/claims',
            gradient: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)',
            hoverBorder: 'rgba(239,68,68,0.3)',
        },
    ];

    return (
        <div className="page-wrapper">
            <div className="page-content">
                {/* ────── Welcome ────── */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                        Welcome back,{' '}
                        <span className="gradient-text">{user?.name?.split(' ')[0]}</span>! 👋
                    </h1>
                    <p style={{ color: '#9898cc', fontSize: '1.0625rem' }}>
                        Here's your insurance dashboard overview.
                    </p>
                </div>

                {/* ────── Stats ────── */}
                <div
                    className="animate-fade-in-up-delay"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.125rem', marginBottom: '2.5rem' }}
                >
                    {stats.map((s) => (
                        <div
                            key={s.label}
                            className="glass-card"
                            style={{
                                padding: '1.5rem 1.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.125rem',
                            }}
                        >
                            <div
                                style={{
                                    width: '3rem',
                                    height: '3rem',
                                    borderRadius: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.375rem',
                                    background: `${s.color}18`,
                                    flexShrink: 0,
                                }}
                            >
                                {s.icon}
                            </div>
                            <div>
                                <p style={{ fontSize: '1.625rem', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                                    {s.value}
                                </p>
                                <p style={{ fontSize: '0.8125rem', color: '#6868a0', marginTop: '0.125rem' }}>
                                    {s.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ────── Quick Actions ────── */}
                <h2
                    className="animate-fade-in-up-delay"
                    style={{ fontSize: '1.125rem', fontWeight: 700, color: '#e0e0ff', marginBottom: '1.25rem' }}
                >
                    Quick Actions
                </h2>

                <div
                    className="animate-fade-in-up-delay-2"
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.125rem', marginBottom: '2rem' }}
                >
                    {quickLinks.map((link) => (
                        <Link
                            key={link.title}
                            to={link.path}
                            className="glass-card"
                            style={{
                                padding: '1.5rem 1.75rem',
                                textDecoration: 'none',
                                transition: 'all 0.3s ease',
                                cursor: link.comingSoon ? 'default' : 'pointer',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.borderColor = link.hoverBorder;
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.12)';
                                e.currentTarget.style.boxShadow = '';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>{link.icon}</span>
                                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'white' }}>{link.title}</span>
                                {link.comingSoon && (
                                    <span
                                        style={{
                                            fontSize: '0.625rem',
                                            fontWeight: 600,
                                            background: 'rgba(124, 58, 237, 0.15)',
                                            color: '#9898cc',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '0.375rem',
                                            letterSpacing: '0.06em',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        Coming Soon
                                    </span>
                                )}
                            </div>
                            <p style={{ fontSize: '0.8125rem', color: '#6868a0', lineHeight: 1.5, paddingLeft: '2.25rem' }}>
                                {link.desc}
                            </p>
                        </Link>
                    ))}
                </div>

                {/* ────── Risk Profile CTA ────── */}
                {!user?.risk_profile && (
                    <div
                        className="glass-card animate-fade-in-up-delay-2"
                        style={{
                            padding: '1.75rem 2rem',
                            borderLeft: '3px solid #f97316',
                            display: 'flex',
                            gap: '1.25rem',
                            alignItems: 'flex-start',
                        }}
                    >
                        <span style={{ fontSize: '1.75rem', lineHeight: 1 }}>💡</span>
                        <div>
                            <h3 style={{ fontWeight: 600, color: '#fbbf24', marginBottom: '0.375rem', fontSize: '1rem' }}>
                                Complete your risk profile
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: '#6868a0', marginBottom: '1rem', lineHeight: 1.6 }}>
                                Set your insurance preferences so we can recommend the best policies for you.
                            </p>
                            <Link to="/preferences" className="btn-secondary">
                                Set Preferences →
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
