import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { comparePolicies, enrollPolicy } from '../services/policyService';

const TYPE_COLORS = {
    health: '#22c55e',
    life: '#f43f5e',
    auto: '#3b82f6',
    home: '#f59e0b',
    travel: '#8b5cf6',
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
}

function formatTerm(months) {
    if (!months) return '—';
    if (months >= 12) {
        const y = months / 12;
        return y === 1 ? '1 year' : `${y} years`;
    }
    return months === 1 ? '1 month' : `${months} months`;
}

const COMPARE_ROWS = [
    { label: 'Provider', key: (p) => p.provider?.name || '—' },
    { label: 'Type', key: (p) => p.policy_type },
    { label: 'Premium / month', key: (p) => formatCurrency(p.premium), highlight: true },
    { label: 'Term', key: (p) => formatTerm(p.term_months) },
    { label: 'Deductible', key: (p) => p.deductible > 0 ? formatCurrency(p.deductible) : 'None' },
];

export default function Compare() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [enrolling, setEnrolling] = useState(null);
    const [toast, setToast] = useState('');

    const ids = (searchParams.get('ids') || '').split(',').map(Number).filter(Boolean);

    useEffect(() => {
        if (ids.length < 2) {
            setError('Please select at least 2 policies to compare.');
            setLoading(false);
            return;
        }
        comparePolicies(ids)
            .then(setPolicies)
            .catch(() => setError('Failed to load comparison. Please try again.'))
            .finally(() => setLoading(false));
    }, [searchParams]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleEnroll = async (policy) => {
        setEnrolling(policy.id);
        try {
            await enrollPolicy(policy.id);
            showToast(`✅ Successfully enrolled in "${policy.title}"!`);
        } catch (err) {
            showToast(err?.response?.data?.detail || '❌ Enrollment failed.');
        } finally {
            setEnrolling(null);
        }
    };

    // Find lowest premium for highlighting
    const minPremium = policies.length ? Math.min(...policies.map(p => p.premium)) : null;

    return (
        <div className="page-wrapper">
            <div className="page-content">
                {/* Toast */}
                {toast && (
                    <div style={{
                        position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 9999,
                        background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '0.75rem', padding: '1rem 1.5rem', color: 'white',
                        fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        animation: 'fadeIn 0.2s ease',
                    }}>
                        {toast}
                    </div>
                )}

                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate('/policies')}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#818cf8', fontSize: '0.875rem', fontWeight: 500,
                            marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                        }}
                    >
                        ← Back to Policies
                    </button>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.375rem' }}>
                        Policy <span className="gradient-text">Comparison</span>
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                        Compare policies side-by-side to find the best fit for you.
                    </p>
                </div>

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
                        <div className="spinner" />
                    </div>
                )}

                {error && (
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</p>
                        <p style={{ color: '#f87171', fontWeight: 600 }}>{error}</p>
                        <button
                            onClick={() => navigate('/policies')}
                            className="btn-primary"
                            style={{ marginTop: '1.5rem' }}
                        >
                            Browse Policies
                        </button>
                    </div>
                )}

                {!loading && !error && policies.length >= 2 && (
                    <div className="animate-fade-in-up">
                        {/* Comparison Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%', borderCollapse: 'separate', borderSpacing: '0 0',
                                minWidth: '600px',
                            }}>
                                {/* Policy Headers */}
                                <thead>
                                    <tr>
                                        <th style={{
                                            width: '160px', padding: '1rem 1.25rem',
                                            background: 'rgba(15,23,42,0.6)', borderRadius: '0.75rem 0 0 0',
                                            textAlign: 'left', fontSize: '0.75rem', color: '#475569',
                                            fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
                                        }}>
                                            Feature
                                        </th>
                                        {policies.map((p, i) => {
                                            const color = TYPE_COLORS[p.policy_type] || '#818cf8';
                                            const isBest = p.premium === minPremium;
                                            return (
                                                <th key={p.id} style={{
                                                    padding: '1.25rem',
                                                    background: isBest ? `${color}12` : 'rgba(15,23,42,0.4)',
                                                    borderTop: isBest ? `2px solid ${color}` : '2px solid transparent',
                                                    borderRadius: i === policies.length - 1 ? '0 0.75rem 0 0' : '0',
                                                    textAlign: 'center',
                                                    position: 'relative',
                                                }}>
                                                    {isBest && (
                                                        <span style={{
                                                            position: 'absolute', top: '-1px', left: '50%',
                                                            transform: 'translateX(-50%) translateY(-50%)',
                                                            background: color, color: 'white',
                                                            fontSize: '0.625rem', fontWeight: 700,
                                                            padding: '0.2rem 0.625rem', borderRadius: '1rem',
                                                            textTransform: 'uppercase', letterSpacing: '0.08em',
                                                            whiteSpace: 'nowrap',
                                                        }}>
                                                            Best Value
                                                        </span>
                                                    )}
                                                    <span style={{
                                                        display: 'inline-block',
                                                        fontSize: '0.6875rem', fontWeight: 700,
                                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                                        padding: '0.2rem 0.625rem', borderRadius: '0.375rem',
                                                        background: `${color}18`, color: color,
                                                        marginBottom: '0.5rem',
                                                    }}>
                                                        {p.policy_type}
                                                    </span>
                                                    <p style={{ fontSize: '1rem', fontWeight: 700, color: 'white', lineHeight: 1.3 }}>
                                                        {p.title}
                                                    </p>
                                                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                                        {p.provider?.name}
                                                    </p>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>

                                {/* Comparison Rows */}
                                <tbody>
                                    {COMPARE_ROWS.map((row, ri) => (
                                        <tr key={ri}>
                                            <td style={{
                                                padding: '1rem 1.25rem',
                                                background: 'rgba(15,23,42,0.3)',
                                                fontSize: '0.8125rem', color: '#94a3b8', fontWeight: 500,
                                                borderBottom: '1px solid rgba(148,163,184,0.06)',
                                            }}>
                                                {row.label}
                                            </td>
                                            {policies.map((p) => {
                                                const val = row.key(p);
                                                const color = TYPE_COLORS[p.policy_type] || '#818cf8';
                                                const isBest = row.highlight && p.premium === minPremium;
                                                return (
                                                    <td key={p.id} style={{
                                                        padding: '1rem 1.25rem',
                                                        background: isBest ? `${color}08` : 'rgba(15,23,42,0.2)',
                                                        textAlign: 'center',
                                                        fontSize: row.highlight ? '1.125rem' : '0.875rem',
                                                        fontWeight: row.highlight ? 700 : 400,
                                                        color: isBest ? color : (row.highlight ? '#a5b4fc' : '#e2e8f0'),
                                                        borderBottom: '1px solid rgba(148,163,184,0.06)',
                                                    }}>
                                                        {val}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}

                                    {/* Coverage rows — union of all keys */}
                                    {(() => {
                                        const allKeys = [...new Set(
                                            policies.flatMap(p => p.coverage ? Object.keys(p.coverage) : [])
                                        )];
                                        return allKeys.map((key) => (
                                            <tr key={key}>
                                                <td style={{
                                                    padding: '0.875rem 1.25rem',
                                                    background: 'rgba(15,23,42,0.3)',
                                                    fontSize: '0.8125rem', color: '#64748b', fontWeight: 500,
                                                    textTransform: 'capitalize',
                                                    borderBottom: '1px solid rgba(148,163,184,0.04)',
                                                }}>
                                                    {key.replace(/_/g, ' ')}
                                                </td>
                                                {policies.map((p) => {
                                                    const val = p.coverage?.[key];
                                                    return (
                                                        <td key={p.id} style={{
                                                            padding: '0.875rem 1.25rem',
                                                            background: 'rgba(15,23,42,0.15)',
                                                            textAlign: 'center',
                                                            fontSize: '0.8125rem', color: '#94a3b8',
                                                            borderBottom: '1px solid rgba(148,163,184,0.04)',
                                                        }}>
                                                            {val === undefined ? '—' :
                                                                typeof val === 'boolean' ? (val ? '✅' : '❌') :
                                                                    String(val)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ));
                                    })()}

                                    {/* Enroll buttons row */}
                                    <tr>
                                        <td style={{
                                            padding: '1.25rem',
                                            background: 'rgba(15,23,42,0.4)',
                                            borderRadius: '0 0 0 0.75rem',
                                        }} />
                                        {policies.map((p, i) => (
                                            <td key={p.id} style={{
                                                padding: '1.25rem',
                                                background: 'rgba(15,23,42,0.3)',
                                                textAlign: 'center',
                                                borderRadius: i === policies.length - 1 ? '0 0 0.75rem 0' : '0',
                                            }}>
                                                <button
                                                    onClick={() => handleEnroll(p)}
                                                    disabled={enrolling === p.id}
                                                    className="btn-primary"
                                                    style={{ width: '100%', fontSize: '0.875rem' }}
                                                >
                                                    {enrolling === p.id ? 'Enrolling…' : 'Enroll Now'}
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/quote?policy_id=${p.id}`)}
                                                    style={{
                                                        marginTop: '0.5rem', width: '100%',
                                                        background: 'none', border: '1px solid rgba(99,102,241,0.25)',
                                                        borderRadius: '0.625rem', padding: '0.625rem',
                                                        color: '#818cf8', fontSize: '0.8125rem', fontWeight: 500,
                                                        cursor: 'pointer', fontFamily: 'inherit',
                                                    }}
                                                >
                                                    Get Quote
                                                </button>
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
