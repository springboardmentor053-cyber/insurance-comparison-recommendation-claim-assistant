import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolicies, enrollPolicy } from '../services/policyService';

const TYPE_FILTERS = [
    { key: 'all', label: 'All Plans', icon: '📋' },
    { key: 'health', label: 'Health', icon: '🏥' },
    { key: 'life', label: 'Life', icon: '❤️' },
    { key: 'auto', label: 'Auto', icon: '🚗' },
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'travel', label: 'Travel', icon: '✈️' },
];

const TYPE_COLORS = {
    health: { accent: '#22c55e', bg: 'rgba(34,197,94,0.06)', border: 'rgba(34,197,94,0.2)', badge: '#22c55e' },
    life: { accent: '#f43f5e', bg: 'rgba(244,63,94,0.06)', border: 'rgba(244,63,94,0.2)', badge: '#f43f5e' },
    auto: { accent: '#3b82f6', bg: 'rgba(59,130,246,0.06)', border: 'rgba(59,130,246,0.2)', badge: '#3b82f6' },
    home: { accent: '#f59e0b', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)', badge: '#f59e0b' },
    travel: { accent: '#8b5cf6', bg: 'rgba(139,92,246,0.06)', border: 'rgba(139,92,246,0.2)', badge: '#8b5cf6' },
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatTerm(months) {
    if (months >= 12) {
        const years = months / 12;
        return years === 1 ? '1 year' : `${years} years`;
    }
    return months === 1 ? '1 month' : `${months} months`;
}

export default function Policies() {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [selected, setSelected] = useState([]);   // IDs selected for compare
    const [enrolling, setEnrolling] = useState(null);
    const [toast, setToast] = useState('');

    useEffect(() => {
        setLoading(true);
        getPolicies(filter)
            .then(setPolicies)
            .catch(() => setPolicies([]))
            .finally(() => setLoading(false));
    }, [filter]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const toggleSelect = (id) => {
        setSelected((prev) =>
            prev.includes(id)
                ? prev.filter((x) => x !== id)
                : prev.length < 3 ? [...prev, id] : prev
        );
    };

    const handleEnroll = async (policy) => {
        setEnrolling(policy.id);
        try {
            await enrollPolicy(policy.id);
            showToast(`✅ Enrolled in "${policy.title}"! View in My Policies.`);
        } catch (err) {
            showToast(err?.response?.data?.detail || '❌ Enrollment failed.');
        } finally {
            setEnrolling(null);
        }
    };

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
                    }}>
                        {toast}
                    </div>
                )}

                {/* Floating Compare Bar */}
                {selected.length >= 2 && (
                    <div style={{
                        position: 'fixed', bottom: '1.5rem', left: '50%',
                        transform: 'translateX(-50%)', zIndex: 9998,
                        background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '1rem', padding: '0.875rem 1.5rem',
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(12px)',
                    }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            {selected.length} selected
                        </span>
                        <button
                            onClick={() => navigate(`/compare?ids=${selected.join(',')}`)}
                            className="btn-primary"
                            style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
                        >
                            Compare Now →
                        </button>
                        <button
                            onClick={() => setSelected([])}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#475569', fontSize: '1.125rem', lineHeight: 1,
                            }}
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* ────── Header ────── */}
                <div className="animate-fade-in-up" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
                            Browse <span className="gradient-text">Insurance Policies</span>
                        </h1>
                        <button
                            onClick={() => navigate('/my-policies')}
                            style={{
                                padding: '0.625rem 1.25rem',
                                background: 'rgba(99,102,241,0.08)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '0.625rem', color: '#818cf8',
                                fontSize: '0.875rem', fontWeight: 500,
                                cursor: 'pointer', fontFamily: 'inherit',
                            }}
                        >
                            🛡️ My Policies
                        </button>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '1.0625rem' }}>
                        Compare plans from top Indian insurers. Select up to 3 to compare side-by-side.
                    </p>
                </div>

                {/* ────── Filter Tabs ────── */}
                <div
                    className="animate-fade-in-up"
                    style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}
                >
                    {TYPE_FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`chip ${filter === f.key ? 'chip-active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                        >
                            <span>{f.icon}</span>
                            <span>{f.label}</span>
                        </button>
                    ))}
                </div>

                {/* ────── Loading ────── */}
                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
                        <div className="spinner"></div>
                    </div>
                )}

                {/* ────── No Results ────── */}
                {!loading && policies.length === 0 && (
                    <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔍</p>
                        <p style={{ fontSize: '1.125rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '0.375rem' }}>
                            No policies found
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#475569' }}>
                            Try a different category or check back later.
                        </p>
                    </div>
                )}

                {/* ────── Policy Cards ────── */}
                {!loading && policies.length > 0 && (
                    <div
                        className="animate-fade-in-up-delay"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                            gap: '1.25rem',
                        }}
                    >
                        {policies.map((policy) => {
                            const colors = TYPE_COLORS[policy.policy_type] || TYPE_COLORS.health;
                            const isExpanded = expanded === policy.id;
                            const isSelected = selected.includes(policy.id);
                            const canSelect = isSelected || selected.length < 3;

                            return (
                                <div
                                    key={policy.id}
                                    className="glass-card"
                                    style={{
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease',
                                        outline: isSelected ? `2px solid ${colors.accent}` : '2px solid transparent',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3), 0 0 0 1px ${colors.border}`;
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '';
                                    }}
                                >
                                    {/* Card Header */}
                                    <div
                                        style={{
                                            padding: '1.25rem 1.5rem',
                                            background: colors.bg,
                                            borderBottom: `1px solid ${colors.border}`,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                                            <span
                                                style={{
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.08em',
                                                    padding: '0.25rem 0.625rem',
                                                    borderRadius: '0.375rem',
                                                    background: `${colors.accent}18`,
                                                    color: colors.accent,
                                                }}
                                            >
                                                {policy.policy_type}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                {policy.provider && (
                                                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                                                        {policy.provider.name}
                                                    </span>
                                                )}
                                                {/* Compare Checkbox */}
                                                <button
                                                    onClick={() => toggleSelect(policy.id)}
                                                    title={isSelected ? 'Remove from compare' : canSelect ? 'Add to compare' : 'Max 3 selected'}
                                                    style={{
                                                        width: '22px', height: '22px',
                                                        borderRadius: '0.375rem',
                                                        border: `2px solid ${isSelected ? colors.accent : 'rgba(148,163,184,0.3)'}`,
                                                        background: isSelected ? `${colors.accent}20` : 'transparent',
                                                        cursor: canSelect ? 'pointer' : 'not-allowed',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.75rem', color: colors.accent,
                                                        flexShrink: 0, transition: 'all 0.15s ease',
                                                    }}
                                                >
                                                    {isSelected ? '✓' : ''}
                                                </button>
                                            </div>
                                        </div>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white', lineHeight: 1.35 }}>
                                            {policy.title}
                                        </h3>
                                    </div>

                                    {/* Card Body */}
                                    <div style={{ padding: '1.5rem' }}>
                                        {/* Metrics */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                            <div
                                                style={{
                                                    background: 'rgba(15,23,42,0.5)',
                                                    borderRadius: '0.75rem',
                                                    padding: '1rem',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                <p style={{ fontSize: '0.6875rem', color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                                                    Premium
                                                </p>
                                                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#a5b4fc' }}>
                                                    {formatCurrency(policy.premium)}
                                                </p>
                                                <p style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.125rem' }}>
                                                    per month
                                                </p>
                                            </div>
                                            <div
                                                style={{
                                                    background: 'rgba(15,23,42,0.5)',
                                                    borderRadius: '0.75rem',
                                                    padding: '1rem',
                                                    textAlign: 'center',
                                                }}
                                            >
                                                <p style={{ fontSize: '0.6875rem', color: '#475569', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                                                    Term
                                                </p>
                                                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#67e8f9' }}>
                                                    {formatTerm(policy.term_months)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Deductible */}
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.75rem 1rem',
                                                background: 'rgba(15,23,42,0.3)',
                                                borderRadius: '0.625rem',
                                                marginBottom: '1.25rem',
                                            }}
                                        >
                                            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Deductible</span>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white' }}>
                                                {policy.deductible > 0 ? formatCurrency(policy.deductible) : 'None'}
                                            </span>
                                        </div>

                                        {/* Coverage Toggle */}
                                        {policy.coverage && (
                                            <>
                                                <button
                                                    onClick={() => setExpanded(isExpanded ? null : policy.id)}
                                                    style={{
                                                        width: '100%',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        padding: '0.625rem 0',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8125rem',
                                                        fontWeight: 600,
                                                        color: '#818cf8',
                                                        fontFamily: 'inherit',
                                                        marginBottom: isExpanded ? '0.75rem' : '0',
                                                    }}
                                                >
                                                    <span>Coverage Details</span>
                                                    <span
                                                        style={{
                                                            transition: 'transform 0.2s ease',
                                                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                                            fontSize: '0.75rem',
                                                        }}
                                                    >
                                                        ▼
                                                    </span>
                                                </button>

                                                {isExpanded && (
                                                    <div
                                                        className="animate-fade-in"
                                                        style={{
                                                            background: 'rgba(15,23,42,0.4)',
                                                            borderRadius: '0.75rem',
                                                            padding: '1rem 1.125rem',
                                                            marginBottom: '1.25rem',
                                                        }}
                                                    >
                                                        {Object.entries(policy.coverage).map(([key, value], i, arr) => (
                                                            <div
                                                                key={key}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    padding: '0.5rem 0',
                                                                    borderBottom: i < arr.length - 1 ? '1px solid rgba(148,163,184,0.06)' : 'none',
                                                                }}
                                                            >
                                                                <span style={{ fontSize: '0.8125rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                                                                    {key.replace(/_/g, ' ')}
                                                                </span>
                                                                <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#e2e8f0' }}>
                                                                    {typeof value === 'boolean' ? (value ? '✅ Yes' : '❌ No') : String(value)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* T&C Link + Action Buttons */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {/* Action Buttons */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => navigate(`/quote?policy_id=${policy.id}`)}
                                                    style={{
                                                        padding: '0.625rem',
                                                        background: 'rgba(103,232,249,0.06)',
                                                        border: '1px solid rgba(103,232,249,0.15)',
                                                        borderRadius: '0.625rem', color: '#67e8f9',
                                                        fontSize: '0.75rem', fontWeight: 500,
                                                        cursor: 'pointer', fontFamily: 'inherit',
                                                    }}
                                                >
                                                    ⚡ Get Quote
                                                </button>
                                                <button
                                                    onClick={() => handleEnroll(policy)}
                                                    disabled={enrolling === policy.id}
                                                    className="btn-primary"
                                                    style={{ fontSize: '0.75rem', padding: '0.625rem' }}
                                                >
                                                    {enrolling === policy.id ? 'Enrolling…' : '🛡️ Enroll'}
                                                </button>
                                            </div>

                                            {/* T&C Link */}
                                            {policy.tnc_url && (
                                                <a
                                                    href={policy.tnc_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'block',
                                                        width: '100%',
                                                        textAlign: 'center',
                                                        padding: '0.75rem',
                                                        borderRadius: '0.625rem',
                                                        background: 'rgba(99,102,241,0.06)',
                                                        color: '#a5b4fc',
                                                        border: '1px solid rgba(99,102,241,0.15)',
                                                        fontSize: '0.8125rem',
                                                        fontWeight: 500,
                                                        textDecoration: 'none',
                                                        transition: 'all 0.2s ease',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(99,102,241,0.12)';
                                                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(99,102,241,0.06)';
                                                        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)';
                                                    }}
                                                >
                                                    View Terms & Conditions →
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Summary */}
                {!loading && policies.length > 0 && (
                    <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#475569', marginTop: '1.5rem', paddingBottom: selected.length >= 2 ? '5rem' : '0' }}>
                        Showing {policies.length} {filter === 'all' ? '' : filter + ' '}{policies.length === 1 ? 'policy' : 'policies'}
                        {selected.length > 0 && <span style={{ color: '#818cf8' }}> · {selected.length} selected for compare</span>}
                    </p>
                )}
            </div>
        </div>
    );
}
