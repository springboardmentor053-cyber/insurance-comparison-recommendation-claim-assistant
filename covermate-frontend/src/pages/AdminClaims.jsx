import { useState, useEffect } from 'react';
import {
    getAllClaims, acceptClaim, rejectClaim, requestMoreInfo, updateClaimStatus,
} from '../services/adminService';
import api from '../services/api';

// ── Status config ──
const STATUS_CONFIG = {
    draft:        { bg: 'rgba(100,100,130,0.2)', color: '#9898cc', label: 'Draft' },
    submitted:    { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'Submitted' },
    under_review: { bg: 'rgba(234,179,8,0.15)',  color: '#fbbf24', label: 'Under Review' },
    approved:     { bg: 'rgba(34,197,94,0.15)',  color: '#4ade80', label: 'Approved' },
    rejected:     { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', label: 'Rejected' },
    paid:         { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', label: 'Paid' },
};

const PIPELINE_STEPS = ['submitted', 'under_review', 'approved', 'paid'];

function StatusBadge({ status }) {
    const c = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
        <span style={{ background: c.bg, color: c.color, padding: '0.25rem 0.625rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
            {c.label}
        </span>
    );
}

// ── Claim Pipeline Tracker ──
function PipelineTracker({ status }) {
    const rejected = status === 'rejected';
    const stepIdx  = PIPELINE_STEPS.indexOf(status);

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, margin: '0.5rem 0 0.75rem' }}>
            {PIPELINE_STEPS.map((step, i) => {
                const done    = stepIdx > i;
                const current = stepIdx === i && !rejected;
                const stepColor = done || current ? '#7c3aed' : 'rgba(100,100,130,0.3)';
                return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
                            <div style={{
                                width: '1.5rem', height: '1.5rem', borderRadius: '50%',
                                background: done ? '#7c3aed' : current ? 'rgba(124,58,237,0.3)' : 'rgba(100,100,130,0.15)',
                                border: `2px solid ${stepColor}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.6rem', color: done || current ? '#fff' : '#6868a0',
                                fontWeight: 700, transition: 'all 0.3s',
                            }}>
                                {done ? '✓' : i + 1}
                            </div>
                            <span style={{ fontSize: '0.6rem', color: done || current ? '#c4b5fd' : '#6868a0', marginTop: '0.2rem', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                                {step.replace('_', ' ')}
                            </span>
                        </div>
                        {i < PIPELINE_STEPS.length - 1 && (
                            <div style={{ flex: 1, height: '2px', background: done ? '#7c3aed' : 'rgba(100,100,130,0.2)', margin: '0 0.25rem', marginBottom: '1rem', transition: 'all 0.3s' }} />
                        )}
                    </div>
                );
            })}
            {rejected && (
                <span style={{ marginLeft: '0.5rem', color: '#f87171', fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    ❌ Rejected
                </span>
            )}
        </div>
    );
}

// ── Review Modal ──
function ReviewModal({ claim, onClose, onAction }) {
    const [mode,    setMode]    = useState(null);  // 'reject' | 'request'
    const [text,    setText]    = useState('');
    const [sending, setSending] = useState(false);
    const [msg,     setMsg]     = useState('');

    const user   = claim.user_policy?.user;
    const policy = claim.user_policy?.policy;

    const handleAccept = async () => {
        setSending(true);
        try {
            await acceptClaim(claim.id);
            setMsg('✅ Claim approved & email sent.');
            onAction();
        } catch (e) {
            setMsg('❌ ' + (e.response?.data?.detail || 'Failed'));
        } finally { setSending(false); }
    };

    const handleReject = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            await rejectClaim(claim.id, text.trim());
            setMsg('❌ Claim rejected & email sent.');
            onAction();
        } catch (e) {
            setMsg('❌ ' + (e.response?.data?.detail || 'Failed'));
        } finally { setSending(false); }
    };

    const handleRequest = async () => {
        if (!text.trim()) return;
        setSending(true);
        try {
            await requestMoreInfo(claim.id, text.trim());
            setMsg('📋 Info request sent to user.');
            onAction();
        } catch (e) {
            setMsg('❌ ' + (e.response?.data?.detail || 'Failed'));
        } finally { setSending(false); }
    };

    return (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={onClose}>
            <div
                className="glass-card animate-fade-in"
                style={{ width:'100%', maxWidth:'36rem', padding:'2rem', maxHeight:'90vh', overflowY:'auto' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'1.5rem' }}>
                    <div>
                        <h2 style={{ fontWeight:800, color:'#e0e0ff', fontSize:'1.125rem' }}>Review Claim</h2>
                        <p style={{ color:'#6868a0', fontSize:'0.8125rem', marginTop:'0.25rem' }}>{claim.claim_number}</p>
                    </div>
                    <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#6868a0', cursor:'pointer', fontSize:'1.25rem', lineHeight:1, padding:'0.25rem' }}>×</button>
                </div>

                {/* Claim Info */}
                <div style={{ background:'rgba(124,58,237,0.06)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1.25rem', fontSize:'0.875rem' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem 1rem' }}>
                        {[
                            ['Claimant', user?.name || '—'],
                            ['Email', user?.email || '—'],
                            ['Policy', policy?.title || '—'],
                            ['Type', claim.claim_type || '—'],
                            ['Amount', `₹${Number(claim.amount_claimed).toLocaleString('en-IN')}`],
                            ['Incident Date', claim.incident_date || '—'],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <span style={{ color:'#6868a0', fontSize:'0.75rem', display:'block' }}>{k}</span>
                                <span style={{ color:'#e0e0ff', fontWeight:600 }}>{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pipeline */}
                <PipelineTracker status={claim.status} />

                {/* Fraud flags */}
                {claim.fraud_flags?.length > 0 && (
                    <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'0.625rem', padding:'0.75rem 1rem', marginBottom:'1.25rem', fontSize:'0.8125rem' }}>
                        <p style={{ color:'#f87171', fontWeight:700, marginBottom:'0.5rem' }}>⚠️ Fraud Flags ({claim.fraud_flags.length})</p>
                        {claim.fraud_flags.map((f, i) => (
                            <div key={i} style={{ color:'#fca5a5', marginBottom:'0.25rem' }}>
                                <code style={{ fontSize:'0.75rem', background:'rgba(239,68,68,0.1)', padding:'0.125rem 0.375rem', borderRadius:'0.25rem' }}>{f.rule_code}</code>
                                {' '}{f.details}
                            </div>
                        ))}
                    </div>
                )}

                {/* Status message */}
                {msg && (
                    <div style={{ background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', borderRadius:'0.625rem', padding:'0.75rem 1rem', marginBottom:'1.25rem', color:'#c4b5fd', fontSize:'0.875rem' }}>
                        {msg}
                    </div>
                )}

                {/* Actions */}
                {!msg && (claim.status === 'submitted' || claim.status === 'under_review') && (
                    <>
                        {!mode ? (
                            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                                <button onClick={handleAccept} disabled={sending} style={{ flex:1, padding:'0.75rem', borderRadius:'0.625rem', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', color:'#4ade80', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>
                                    ✅ Accept
                                </button>
                                <button onClick={() => { setMode('reject'); setText(''); }} style={{ flex:1, padding:'0.75rem', borderRadius:'0.625rem', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>
                                    ❌ Reject
                                </button>
                                <button onClick={() => { setMode('request'); setText(''); }} style={{ flex:1, padding:'0.75rem', borderRadius:'0.625rem', background:'rgba(234,179,8,0.12)', border:'1px solid rgba(234,179,8,0.25)', color:'#fbbf24', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>
                                    📋 Request Info
                                </button>
                            </div>
                        ) : (
                            <div>
                                <label style={{ display:'block', fontSize:'0.8125rem', fontWeight:600, color:'#9898cc', marginBottom:'0.5rem' }}>
                                    {mode === 'reject' ? '❌ Rejection reason (required)' : '📋 Message to user (required)'}
                                </label>
                                <textarea
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    rows={3}
                                    placeholder={mode === 'reject' ? 'Enter the reason for rejection…' : 'Describe what additional information or documents you need…'}
                                    style={{ width:'100%', padding:'0.75rem', borderRadius:'0.625rem', border:'1px solid rgba(124,58,237,0.2)', background:'rgba(124,58,237,0.06)', color:'#e0e0ff', fontSize:'0.875rem', resize:'vertical', outline:'none', boxSizing:'border-box', fontFamily:'inherit', marginBottom:'0.75rem' }}
                                />
                                <div style={{ display:'flex', gap:'0.75rem' }}>
                                    <button onClick={() => setMode(null)} style={{ flex:1, padding:'0.625rem', borderRadius:'0.625rem', background:'transparent', border:'1px solid rgba(100,100,130,0.3)', color:'#9898cc', cursor:'pointer', fontSize:'0.875rem' }}>
                                        ← Back
                                    </button>
                                    <button
                                        onClick={mode === 'reject' ? handleReject : handleRequest}
                                        disabled={!text.trim() || sending}
                                        style={{ flex:1, padding:'0.625rem', borderRadius:'0.625rem',
                                            background: mode === 'reject' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.15)',
                                            border: mode === 'reject' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(234,179,8,0.3)',
                                            color: mode === 'reject' ? '#f87171' : '#fbbf24',
                                            fontWeight:700, cursor:'pointer', fontSize:'0.875rem',
                                            opacity: (!text.trim() || sending) ? 0.5 : 1,
                                        }}
                                    >
                                        {sending ? 'Sending…' : mode === 'reject' ? 'Confirm Reject' : 'Send Request'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
                {!msg && !['submitted','under_review'].includes(claim.status) && (
                    <p style={{ color:'#6868a0', fontSize:'0.875rem', textAlign:'center' }}>
                        This claim is <strong style={{ color:'#9898cc' }}>{claim.status}</strong> — no further actions available.
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Main Component ──
const STATUS_FILTERS = ['All', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Paid'];
const STATUS_MAP     = { 'All': '', 'Draft':'draft', 'Submitted':'submitted', 'Under Review':'under_review', 'Approved':'approved', 'Rejected':'rejected', 'Paid':'paid' };

export default function AdminClaims() {
    const [claims,      setClaims]      = useState([]);
    const [loading,     setLoading]     = useState(true);
    const [error,       setError]       = useState('');
    const [filter,      setFilter]      = useState('All');
    const [selected,    setSelected]    = useState(null);
    const [counts,      setCounts]      = useState({});

    const load = () => {
        setLoading(true);
        getAllClaims()
            .then(data => {
                setClaims(data);
                const c = {};
                data.forEach(cl => { c[cl.status] = (c[cl.status] || 0) + 1; });
                setCounts(c);
            })
            .catch(() => setError('Failed to load claims.'))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const filtered = filter === 'All'
        ? claims
        : claims.filter(c => c.status === STATUS_MAP[filter]);

    const handleExport = () => {
        const token = localStorage.getItem('access_token');
        window.open(`http://localhost:8000/admin/claims/export?token=${token}`, '_blank');
    };

    return (
        <div className="page-wrapper">
            <div className="page-content">
                {/* Header */}
                <div className="animate-fade-in-up" style={{ display:'flex', justifyContent:'space-between', alignItems:'start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize:'2rem', fontWeight:800, marginBottom:'0.25rem' }}>
                            📋 <span className="gradient-text">All Claims</span>
                        </h1>
                        <p style={{ color:'#9898cc' }}>Manage, review, and update all insurance claims</p>
                    </div>
                    <button onClick={handleExport} className="btn-primary" style={{ fontSize:'0.875rem' }}>
                        📤 Export CSV
                    </button>
                </div>

                {error && (
                    <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1.5rem', color:'#f87171' }}>
                        {error}
                    </div>
                )}

                {/* Filter bar */}
                <div className="animate-fade-in-up" style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
                    {STATUS_FILTERS.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{
                                padding:'0.375rem 0.875rem', borderRadius:'2rem', fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', transition:'all 0.2s',
                                background: filter === f ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.07)',
                                border: filter === f ? '1px solid rgba(124,58,237,0.5)' : '1px solid rgba(124,58,237,0.15)',
                                color: filter === f ? '#c4b5fd' : '#6868a0',
                            }}
                        >
                            {f}
                            {f !== 'All' && counts[STATUS_MAP[f]] !== undefined && (
                                <span style={{ marginLeft:'0.4rem', opacity:0.8 }}>({counts[STATUS_MAP[f]] || 0})</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ textAlign:'center', color:'#6868a0', padding:'4rem' }}>Loading claims…</div>
                ) : (
                    <div className="glass-card animate-fade-in-up-delay" style={{ padding:0, overflow:'hidden' }}>
                        <div style={{ overflowX:'auto' }}>
                            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                                <thead>
                                    <tr style={{ borderBottom:'1px solid rgba(124,58,237,0.15)' }}>
                                        {['Claim No.','Claimant','Policy','Type','Amount','Status','Fraud','Date','Actions'].map(h => (
                                            <th key={h} style={{ padding:'0.875rem 1rem', textAlign:'left', color:'#6868a0', fontWeight:600, whiteSpace:'nowrap', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr><td colSpan={9} style={{ padding:'3rem', textAlign:'center', color:'#6868a0' }}>No claims found.</td></tr>
                                    ) : filtered.map(c => {
                                        const user   = c.user_policy?.user;
                                        const policy = c.user_policy?.policy;
                                        const flags  = c.fraud_flags || [];
                                        return (
                                            <tr key={c.id}
                                                style={{ borderBottom:'1px solid rgba(124,58,237,0.07)', cursor:'pointer' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background = ''}
                                            >
                                                <td style={{ padding:'0.875rem 1rem', color:'#e0e0ff', fontWeight:700, whiteSpace:'nowrap' }}>{c.claim_number}</td>
                                                <td style={{ padding:'0.875rem 1rem', color:'#9898cc' }}>{user?.name || '—'}</td>
                                                <td style={{ padding:'0.875rem 1rem', color:'#9898cc', maxWidth:'14rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{policy?.title || '—'}</td>
                                                <td style={{ padding:'0.875rem 1rem', color:'#9898cc', textTransform:'capitalize' }}>{c.claim_type || '—'}</td>
                                                <td style={{ padding:'0.875rem 1rem', color:'#e0e0ff', fontWeight:600, whiteSpace:'nowrap' }}>₹{Number(c.amount_claimed).toLocaleString('en-IN')}</td>
                                                <td style={{ padding:'0.875rem 1rem' }}><StatusBadge status={c.status} /></td>
                                                <td style={{ padding:'0.875rem 1rem' }}>
                                                    {flags.length > 0
                                                        ? <span style={{ color:'#ef4444', fontWeight:700 }}>⚠️ {flags.length}</span>
                                                        : <span style={{ color:'#4ade80' }}>✅</span>
                                                    }
                                                </td>
                                                <td style={{ padding:'0.875rem 1rem', color:'#6868a0', whiteSpace:'nowrap', fontSize:'0.8rem' }}>
                                                    {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
                                                </td>
                                                <td style={{ padding:'0.875rem 1rem' }}>
                                                    <button
                                                        onClick={() => setSelected(c)}
                                                        style={{ padding:'0.375rem 0.875rem', borderRadius:'0.5rem', background:'rgba(124,58,237,0.15)', border:'1px solid rgba(124,58,237,0.3)', color:'#c4b5fd', fontWeight:600, cursor:'pointer', fontSize:'0.8125rem', whiteSpace:'nowrap' }}
                                                    >
                                                        Review →
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {selected && (
                <ReviewModal
                    claim={selected}
                    onClose={() => setSelected(null)}
                    onAction={() => { setSelected(null); load(); }}
                />
            )}
        </div>
    );
}
