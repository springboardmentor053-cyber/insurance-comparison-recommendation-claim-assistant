import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyClaims } from '../services/claimService';

const STATUS_STYLES = {
    draft: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: 'Draft' },
    submitted: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', label: 'Submitted' },
    under_review: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Under Review' },
    approved: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Approved' },
    rejected: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Rejected' },
    paid: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Paid' },
};

function formatCurrency(amount) {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Claims() {
    const navigate = useNavigate();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMyClaims()
            .then(setClaims)
            .catch(() => setClaims([]))
            .finally(() => setLoading(false));
    }, []);

    const active = claims.filter(c => !['approved', 'rejected', 'paid'].includes(c.status));
    const resolved = claims.filter(c => ['approved', 'rejected', 'paid'].includes(c.status));

    return (
        <div className="page-wrapper">
            <div className="page-content">
                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.375rem' }}>
                            My <span className="gradient-text">Claims</span>
                        </h1>
                        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                            Track and manage your insurance claims.
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/claims/new')}
                        className="btn-primary"
                        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', boxShadow: '0 4px 14px rgba(249,115,22,0.4)' }}
                    >
                        📝 File New Claim
                    </button>
                </div>

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
                        <div className="spinner" />
                    </div>
                )}

                {!loading && claims.length === 0 && (
                    <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</p>
                        <p style={{ fontSize: '1.125rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '0.375rem' }}>
                            No claims filed yet
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem' }}>
                            If you experience an incident, you can file a claim here to get reimbursed.
                        </p>
                        <button onClick={() => navigate('/claims/new')} className="btn-primary">
                            File a Claim →
                        </button>
                    </div>
                )}

                {!loading && claims.length > 0 && (
                    <>
                        {/* Summary Bar */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '1rem', marginBottom: '2rem',
                        }}>
                            {[
                                { label: 'Total Filed', value: claims.length, color: '#a5b4fc' },
                                { label: 'In Progress', value: active.length, color: '#f59e0b' },
                                { label: 'Resolved', value: resolved.length, color: '#22c55e' },
                            ].map((s) => (
                                <div key={s.label} className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Claims List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {claims.map((claim) => {
                                const statusStyle = STATUS_STYLES[claim.status] || STATUS_STYLES.draft;

                                return (
                                    <div
                                        key={claim.id}
                                        onClick={() => navigate(`/claims/${claim.id}`)}
                                        className="glass-card animate-fade-in-up"
                                        style={{ 
                                            padding: '1.5rem', 
                                            borderLeft: `3px solid ${statusStyle.color}`,
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                            {/* Left: Claim Info */}
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        fontSize: '0.6875rem', fontWeight: 600,
                                                        padding: '0.2rem 0.625rem', borderRadius: '0.375rem',
                                                        background: statusStyle.bg, color: statusStyle.color,
                                                    }}>
                                                        ● {statusStyle.label}
                                                    </span>
                                                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                                        {formatDate(claim.incident_date)}
                                                    </span>
                                                </div>
                                                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                                                    {claim.claim_type} — {claim.claim_number}
                                                </h3>
                                                <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                                                    Policy: {claim.user_policy?.policy?.title || 'Unknown'}
                                                </p>
                                            </div>

                                            {/* Right: Amount & Action */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '0.6875rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.125rem' }}>
                                                        Amount Claimed
                                                    </p>
                                                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#e2e8f0' }}>
                                                        {formatCurrency(claim.amount_claimed)}
                                                    </p>
                                                </div>
                                                <div style={{ color: '#64748b', fontSize: '1.25rem' }}>
                                                    →
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
