import { useState, useEffect } from 'react';
import { getAllFraudFlags, getAllClaims } from '../services/adminService';

const RULE_META = {
    DUP_DOC:            { label: 'Duplicate Document', icon: '📄', color: '#ef4444' },
    SUSPICIOUS_TIMING:  { label: 'Suspicious Timing',  icon: '⏰', color: '#f59e0b' },
    HIGH_AMOUNT:        { label: 'High Amount',        icon: '💰', color: '#f97316' },
};

const SeverityBadge = ({ severity }) => {
    const map = {
        high:   { bg: 'rgba(239,68,68,0.15)',  color: '#f87171',  label: '🔴 High' },
        medium: { bg: 'rgba(234,179,8,0.15)',  color: '#fbbf24',  label: '🟡 Medium' },
        low:    { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80',  label: '🟢 Low' },
    };
    const c = map[severity] || map.low;
    return (
        <span style={{ background: c.bg, color: c.color, padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>
            {c.label}
        </span>
    );
};

export default function AdminFraudFlags() {
    const [flags, setFlags] = useState([]);
    const [claims, setClaims] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [filterRule, setFilterRule] = useState('all');

    useEffect(() => {
        Promise.all([getAllFraudFlags(), getAllClaims()])
            .then(([flagData, claimData]) => {
                setFlags(flagData);
                // Build a map of claim_id → claim object for quick lookup
                const claimMap = {};
                claimData.forEach(c => { claimMap[c.id] = c; });
                setClaims(claimMap);
                setError('');
            })
            .catch(() => setError('Failed to load fraud flags.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = flags.filter(f => {
        const matchSev  = filterSeverity === 'all' || f.severity === filterSeverity;
        const matchRule = filterRule === 'all' || f.rule_code === filterRule;
        return matchSev && matchRule;
    });

    const highCount   = flags.filter(f => f.severity === 'high').length;
    const mediumCount = flags.filter(f => f.severity === 'medium').length;
    const lowCount    = flags.filter(f => f.severity === 'low').length;

    return (
        <div className="page-wrapper">
            <div className="page-content">
                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        🚨 <span className="gradient-text">Fraud Flags</span>
                    </h1>
                    <p style={{ color: '#9898cc' }}>All fraud detection alerts across the platform</p>
                </div>

                {/* Summary cards */}
                <div className="animate-fade-in-up-delay" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Total Flags', value: flags.length,  icon: '⚠️', color: '#a78bfa' },
                        { label: 'High',        value: highCount,     icon: '🔴', color: '#ef4444' },
                        { label: 'Medium',      value: mediumCount,   icon: '🟡', color: '#f59e0b' },
                        { label: 'Low',         value: lowCount,      icon: '🟢', color: '#22c55e' },
                    ].map(s => (
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

                {/* Filters */}
                <div className="animate-fade-in-up-delay" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {['all', 'high', 'medium', 'low'].map(s => (
                            <button key={s} onClick={() => setFilterSeverity(s)} style={{ padding: '0.35rem 0.9rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: 600, border: 'none', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s', background: filterSeverity === s ? '#7c3aed' : 'rgba(124,58,237,0.1)', color: filterSeverity === s ? 'white' : '#9898cc' }}>
                                {s}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {['all', 'DUP_DOC', 'SUSPICIOUS_TIMING', 'HIGH_AMOUNT'].map(r => (
                            <button key={r} onClick={() => setFilterRule(r)} style={{ padding: '0.35rem 0.9rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: filterRule === r ? '#ef4444' : 'rgba(239,68,68,0.08)', color: filterRule === r ? 'white' : '#9898cc' }}>
                                {r === 'all' ? 'All Rules' : (RULE_META[r]?.label || r)}
                            </button>
                        ))}
                    </div>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', color: '#f87171' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#6868a0', padding: '4rem' }}>Loading fraud flags…</div>
                ) : (
                    <div className="animate-fade-in-up-delay-2">
                        {filtered.length === 0 ? (
                            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                                <p style={{ color: '#9898cc', fontSize: '1rem' }}>No fraud flags found for this filter.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {filtered.map(f => {
                                    const claim = claims[f.claim_id];
                                    const user = claim?.user_policy?.user;
                                    const policy = claim?.user_policy?.policy;
                                    const meta = RULE_META[f.rule_code] || { label: f.rule_code, icon: '⚠️', color: '#a78bfa' };
                                    return (
                                        <div
                                            key={f.id}
                                            className="glass-card"
                                            style={{ padding: '1.25rem 1.5rem', borderLeft: `3px solid ${meta.color}` }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <span style={{ fontSize: '1.5rem' }}>{meta.icon}</span>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                            <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9375rem' }}>{meta.label}</span>
                                                            <span style={{ background: `${meta.color}20`, color: meta.color, padding: '0.1rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                                                                {f.rule_code}
                                                            </span>
                                                        </div>
                                                        <span style={{ color: '#6868a0', fontSize: '0.8rem' }}>
                                                            Claim: <strong style={{ color: '#a78bfa' }}>{claim?.claim_number || `#${f.claim_id}`}</strong>
                                                            {user && <span> · {user.name}</span>}
                                                            {policy && <span style={{ marginLeft: '0.25rem' }}>· {policy.title}</span>}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                                                    <SeverityBadge severity={f.severity} />
                                                    <span style={{ color: '#6868a0', fontSize: '0.75rem' }}>
                                                        {f.created_at ? new Date(f.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <p style={{ color: '#9898cc', fontSize: '0.875rem', lineHeight: 1.6, margin: 0, paddingLeft: '2.25rem' }}>
                                                {f.details}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p style={{ color: '#6868a0', fontSize: '0.8rem', marginTop: '0.75rem', textAlign: 'right' }}>
                            Showing {filtered.length} of {flags.length} flags
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
