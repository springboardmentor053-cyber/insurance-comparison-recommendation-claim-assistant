import { useState, useEffect } from 'react';
import { getAllClaims, updateClaimStatus, exportClaimsCSV } from '../services/adminService';

const STATUS_OPTIONS = {
    draft:        ['submitted'],
    submitted:    ['under_review'],
    under_review: ['approved', 'rejected'],
    approved:     ['paid'],
    rejected:     [],
    paid:         [],
};

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

const SeverityBadge = ({ severity }) => {
    const map = {
        high:   { bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
        medium: { bg: 'rgba(234,179,8,0.15)',  color: '#fbbf24' },
        low:    { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
    };
    const c = map[severity] || map.low;
    return (
        <span style={{ background: c.bg, color: c.color, padding: '0.15rem 0.5rem', borderRadius: '0.75rem', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
            {severity}
        </span>
    );
};

export default function AdminClaims() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [updating, setUpdating] = useState({});
    const [toast, setToast] = useState('');
    const [exportLoading, setExportLoading] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);

    const load = () => {
        setLoading(true);
        getAllClaims()
            .then(data => { setClaims(data); setError(''); })
            .catch(() => setError('Failed to load claims.'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleStatusChange = async (claimId, newStatus) => {
        setUpdating(u => ({ ...u, [claimId]: true }));
        try {
            await updateClaimStatus(claimId, newStatus);
            showToast(`Claim status updated to "${newStatus.replace('_', ' ')}"`);
            load();
        } catch (e) {
            showToast(e?.response?.data?.detail || 'Update failed');
        } finally {
            setUpdating(u => ({ ...u, [claimId]: false }));
        }
    };

    const handleExport = async () => {
        setExportLoading(true);
        try { await exportClaimsCSV(); showToast('CSV downloaded!'); }
        catch { showToast('Export failed'); }
        finally { setExportLoading(false); }
    };

    const filtered = filterStatus === 'all' ? claims : claims.filter(c => c.status === filterStatus);

    return (
        <div className="page-wrapper">
            <div className="page-content">
                {/* Toast */}
                {toast && (
                    <div style={{ position: 'fixed', top: '5rem', right: '1.5rem', background: 'rgba(124,58,237,0.9)', color: 'white', padding: '0.875rem 1.25rem', borderRadius: '0.75rem', zIndex: 9999, fontSize: '0.875rem', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
                        {toast}
                    </div>
                )}

                {/* Header */}
                <div className="animate-fade-in-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                            📋 <span className="gradient-text">All Claims</span>
                        </h1>
                        <p style={{ color: '#9898cc' }}>Manage, review, and update all insurance claims</p>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={exportLoading}
                        className="btn-primary"
                        style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {exportLoading ? 'Downloading…' : '⬇️ Export CSV'}
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="animate-fade-in-up-delay" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    {['all', 'draft', 'submitted', 'under_review', 'approved', 'rejected', 'paid'].map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            style={{
                                padding: '0.4rem 1rem',
                                borderRadius: '2rem',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: 'none',
                                textTransform: 'capitalize',
                                transition: 'all 0.2s',
                                background: filterStatus === s ? '#7c3aed' : 'rgba(124,58,237,0.1)',
                                color: filterStatus === s ? 'white' : '#9898cc',
                            }}
                        >
                            {s.replace('_', ' ')}
                            {s !== 'all' && (
                                <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', opacity: 0.75 }}>
                                    ({claims.filter(c => c.status === s).length})
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1rem', color: '#f87171' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#6868a0', padding: '4rem' }}>Loading claims…</div>
                ) : (
                    <div className="animate-fade-in-up-delay-2">
                        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid rgba(124,58,237,0.15)' }}>
                                            {['Claim No.', 'Claimant', 'Policy', 'Type', 'Amount', 'Status', 'Fraud Flags', 'Date', 'Action'].map(h => (
                                                <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', color: '#6868a0', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length === 0 ? (
                                            <tr><td colSpan={9} style={{ padding: '3rem', textAlign: 'center', color: '#6868a0' }}>No claims found.</td></tr>
                                        ) : filtered.map(c => {
                                            const user = c.user_policy?.user;
                                            const policy = c.user_policy?.policy;
                                            const flags = c.fraud_flags || [];
                                            const nextStatuses = STATUS_OPTIONS[c.status] || [];
                                            const isExpanded = expandedRow === c.id;

                                            return (
                                                <>
                                                    <tr
                                                        key={c.id}
                                                        style={{ borderBottom: isExpanded ? 'none' : '1px solid rgba(124,58,237,0.08)', cursor: 'pointer', transition: 'background 0.15s' }}
                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.05)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = ''}
                                                        onClick={() => setExpandedRow(isExpanded ? null : c.id)}
                                                    >
                                                        <td style={{ padding: '0.875rem 1rem', color: '#e0e0ff', fontWeight: 600 }}>{c.claim_number}</td>
                                                        <td style={{ padding: '0.875rem 1rem' }}>
                                                            <div style={{ color: '#e0e0ff', fontWeight: 500 }}>{user?.name || '—'}</div>
                                                            <div style={{ color: '#6868a0', fontSize: '0.75rem' }}>{user?.email || ''}</div>
                                                        </td>
                                                        <td style={{ padding: '0.875rem 1rem', color: '#9898cc', maxWidth: '14rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{policy?.title || '—'}</td>
                                                        <td style={{ padding: '0.875rem 1rem', color: '#9898cc', textTransform: 'capitalize' }}>{c.claim_type || '—'}</td>
                                                        <td style={{ padding: '0.875rem 1rem', color: '#e0e0ff', fontWeight: 600 }}>₹{Number(c.amount_claimed).toLocaleString('en-IN')}</td>
                                                        <td style={{ padding: '0.875rem 1rem' }}><Badge status={c.status} /></td>
                                                        <td style={{ padding: '0.875rem 1rem' }}>
                                                            {flags.length > 0 ? (
                                                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                                    {flags.map(f => <SeverityBadge key={f.id} severity={f.severity} />)}
                                                                </div>
                                                            ) : <span style={{ color: '#4ade80', fontSize: '0.8rem' }}>✅ Clean</span>}
                                                        </td>
                                                        <td style={{ padding: '0.875rem 1rem', color: '#6868a0', whiteSpace: 'nowrap' }}>
                                                            {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                                        </td>
                                                        <td style={{ padding: '0.875rem 1rem' }} onClick={e => e.stopPropagation()}>
                                                            {nextStatuses.length > 0 ? (
                                                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                                                    {nextStatuses.map(ns => (
                                                                        <button
                                                                            key={ns}
                                                                            disabled={updating[c.id]}
                                                                            onClick={() => handleStatusChange(c.id, ns)}
                                                                            style={{
                                                                                background: ns === 'approved' ? 'rgba(34,197,94,0.15)' : ns === 'rejected' ? 'rgba(239,68,68,0.15)' : ns === 'paid' ? 'rgba(168,85,247,0.15)' : 'rgba(124,58,237,0.15)',
                                                                                color: ns === 'approved' ? '#4ade80' : ns === 'rejected' ? '#f87171' : ns === 'paid' ? '#c084fc' : '#a78bfa',
                                                                                border: 'none', borderRadius: '0.5rem', padding: '0.35rem 0.75rem',
                                                                                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                                                                                opacity: updating[c.id] ? 0.6 : 1,
                                                                            }}
                                                                        >
                                                                            {updating[c.id] ? '…' : `→ ${ns.replace('_', ' ')}`}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span style={{ color: '#6868a0', fontSize: '0.75rem' }}>Final</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                    {/* Expanded row: fraud flag details */}
                                                    {isExpanded && flags.length > 0 && (
                                                        <tr key={`${c.id}-flags`} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)', background: 'rgba(239,68,68,0.04)' }}>
                                                            <td colSpan={9} style={{ padding: '0.75rem 1rem 1rem 2rem' }}>
                                                                <p style={{ color: '#f87171', fontWeight: 700, fontSize: '0.8125rem', marginBottom: '0.5rem' }}>⚠️ Fraud Flags Detected</p>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                                                    {flags.map(f => (
                                                                        <div key={f.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                                            <SeverityBadge severity={f.severity} />
                                                                            <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: '0.8rem' }}>{f.rule_code}</span>
                                                                            <span style={{ color: '#9898cc', fontSize: '0.8rem' }}>{f.details}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {isExpanded && flags.length === 0 && (
                                                        <tr key={`${c.id}-clean`} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)', background: 'rgba(34,197,94,0.03)' }}>
                                                            <td colSpan={9} style={{ padding: '0.75rem 1rem 1rem 2rem', color: '#4ade80', fontSize: '0.8125rem' }}>
                                                                ✅ No fraud flags detected for this claim.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <p style={{ color: '#6868a0', fontSize: '0.8rem', marginTop: '0.75rem', textAlign: 'right' }}>
                            Showing {filtered.length} of {claims.length} claims · Click a row to expand fraud details
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
