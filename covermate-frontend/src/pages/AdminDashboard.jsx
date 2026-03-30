import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminDashboard, getAllClaims } from '../services/adminService';

const statusColors = {
    draft:        { bg: 'rgba(100,100,130,0.2)', color: '#9898cc' },
    submitted:    { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa' },
    under_review: { bg: 'rgba(234,179,8,0.15)',  color: '#fbbf24' },
    approved:     { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
    rejected:     { bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
    paid:         { bg: 'rgba(168,85,247,0.15)', color: '#c084fc' },
};

const Badge = ({ status }) => {
    const c = statusColors[status] || statusColors.draft;
    return (
        <span style={{ background: c.bg, color: c.color, padding: '0.2rem 0.65rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize' }}>
            {status?.replace('_', ' ')}
        </span>
    );
};

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [recentClaims, setRecentClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([getAdminDashboard(), getAllClaims()])
            .then(([dash, claims]) => {
                setStats(dash);
                setRecentClaims(claims.slice(0, 8));
            })
            .catch(() => setError('Failed to load dashboard data.'))
            .finally(() => setLoading(false));
    }, []);

    const statCards = stats ? [
        { label: 'Total Claims',    value: stats.total_claims,    icon: '📋', color: '#7c3aed' },
        { label: 'Flagged Claims',  value: stats.flagged_claims,  icon: '🚨', color: '#ef4444' },
        { label: 'Pending Review',  value: stats.pending_review,  icon: '⏳', color: '#f59e0b' },
        { label: 'Approved',        value: stats.approved_claims, icon: '✅', color: '#22c55e' },
        { label: 'Rejected',        value: stats.rejected_claims, icon: '❌', color: '#f87171' },
        { label: 'Paid',            value: stats.paid_claims,     icon: '💰', color: '#a855f7' },
        { label: 'Total Fraud Flags', value: stats.total_fraud_flags, icon: '⚠️', color: '#fb923c' },
    ] : [];

    return (
        <div className="page-wrapper">
            <div className="page-content">
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                                🛡️ <span className="gradient-text">Admin Dashboard</span>
                            </h1>
                            <p style={{ color: '#9898cc' }}>Overview of all claims and fraud detection activity</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <Link to="/admin/claims" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.875rem' }}>
                                📋 All Claims
                            </Link>
                            <Link to="/admin/fraud-flags" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.875rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                                🚨 Fraud Flags
                            </Link>
                        </div>
                    </div>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', color: '#f87171' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#6868a0', padding: '4rem' }}>Loading dashboard…</div>
                ) : (
                    <>
                        {/* ─── Stat Cards ─── */}
                        <div className="animate-fade-in-up-delay" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
                            {statCards.map(s => (
                                <div key={s.label} className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', background: `${s.color}20`, flexShrink: 0 }}>
                                        {s.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '1.625rem', fontWeight: 700, color: 'white', lineHeight: 1.1 }}>{s.value}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6868a0', marginTop: '0.125rem' }}>{s.label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ─── Recent Claims ─── */}
                        <div className="animate-fade-in-up-delay-2">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#e0e0ff' }}>Recent Claims</h2>
                                <Link to="/admin/claims" style={{ fontSize: '0.8125rem', color: '#7c3aed', textDecoration: 'none' }}>View all →</Link>
                            </div>
                            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
                                                {['Claim No.', 'Claimant', 'Policy', 'Amount', 'Status', 'Fraud Flags', 'Date'].map(h => (
                                                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', color: '#6868a0', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentClaims.length === 0 ? (
                                                <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#6868a0' }}>No claims yet.</td></tr>
                                            ) : recentClaims.map(c => {
                                                const user = c.user_policy?.user;
                                                const policy = c.user_policy?.policy;
                                                const flags = c.fraud_flags || [];
                                                return (
                                                    <tr key={c.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.05)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = ''}
                                                    >
                                                        <td style={{ padding: '0.875rem 1rem', color: '#e0e0ff', fontWeight: 600 }}>{c.claim_number}</td>
                                                        <td style={{ padding: '0.875rem 1rem', color: '#9898cc' }}>{user?.name || '—'}</td>
                                                        <td style={{ padding: '0.875rem 1rem', color: '#9898cc', maxWidth: '16rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{policy?.title || '—'}</td>
                                                        <td style={{ padding: '0.875rem 1rem', color: '#e0e0ff', fontWeight: 600 }}>₹{Number(c.amount_claimed).toLocaleString('en-IN')}</td>
                                                        <td style={{ padding: '0.875rem 1rem' }}><Badge status={c.status} /></td>
                                                        <td style={{ padding: '0.875rem 1rem' }}>
                                                            {flags.length > 0
                                                                ? <span style={{ color: '#ef4444', fontWeight: 700 }}>⚠️ {flags.length}</span>
                                                                : <span style={{ color: '#4ade80' }}>✅ Clean</span>
                                                            }
                                                        </td>
                                                        <td style={{ padding: '0.875rem 1rem', color: '#6868a0', whiteSpace: 'nowrap' }}>
                                                            {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
