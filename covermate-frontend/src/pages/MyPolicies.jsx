import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPolicies, cancelPolicy } from '../services/policyService';
import api from '../services/api';
import { API_URL } from '../services/api';

const STATUS_STYLES = {
    active: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', label: 'Active' },
    expired: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'Expired' },
    cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'Cancelled' },
};

const TYPE_COLORS = {
    health: '#22c55e', life: '#f43f5e', auto: '#3b82f6',
    home: '#f59e0b', travel: '#8b5cf6',
};

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyPolicies() {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(null);
    const [confirmId, setConfirmId] = useState(null);
    const [toast, setToast] = useState('');
    // New: PDF, Renew, Endorse
    const [pdfLoading,  setPdfLoading]  = useState(null);
    const [renewLoading, setRenewLoading] = useState(null);
    const [endorsePolicy, setEndorsePolicy] = useState(null);  // {id, number}
    const [endorseType,  setEndorseType]  = useState('address_change');
    const [endorseDetails, setEndorseDetails] = useState('');
    const [endorseSending, setEndorseSending] = useState(false);

    const load = () => {
        setLoading(true);
        getMyPolicies()
            .then(setPolicies)
            .catch(() => setPolicies([]))
            .finally(() => setLoading(false));
    };

    useEffect(load, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleCancel = async (id) => {
        setCancelling(id);
        try {
            await cancelPolicy(id);
            showToast('✅ Policy cancelled successfully.');
            load();
        } catch (err) {
            showToast(err?.response?.data?.detail || '❌ Failed to cancel policy.');
        } finally {
            setCancelling(null);
            setConfirmId(null);
        }
    };

    const handleGeneratePDF = async (upId) => {
        setPdfLoading(upId);
        try {
            const { data } = await api.post(`/user-policies/${upId}/generate-pdf`);
            // open the PDF in a new tab
            window.open(`http://localhost:8000${data.pdf_url}`, '_blank');
            showToast('📄 Policy document ready!');
        } catch (err) {
            showToast(err?.response?.data?.detail || '❌ Failed to generate PDF.');
        } finally {
            setPdfLoading(null);
        }
    };

    const handleRenew = async (upId) => {
        setRenewLoading(upId);
        try {
            await api.post(`/user-policies/${upId}/renew`);
            showToast('🔄 Policy renewed successfully!');
            load();
        } catch (err) {
            showToast(err?.response?.data?.detail || '❌ Renewal failed.');
        } finally {
            setRenewLoading(null);
        }
    };

    const handleEndorse = async () => {
        if (!endorseDetails.trim() || !endorsePolicy) return;
        setEndorseSending(true);
        try {
            await api.post(`/user-policies/${endorsePolicy.id}/endorse`, {
                request_type: endorseType,
                details: endorseDetails.trim(),
            });
            showToast('✏️ Endorsement request submitted!');
            setEndorsePolicy(null); setEndorseDetails(''); setEndorseType('address_change');
        } catch (err) {
            showToast(err?.response?.data?.detail || '❌ Failed to submit endorsement.');
        } finally {
            setEndorseSending(false);
        }
    };

    const active = policies.filter(p => p.status === 'active');
    const others = policies.filter(p => p.status !== 'active');

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

                {/* Confirm Cancel Modal */}
                {confirmId && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 9998,
                        background: 'rgba(0,0,0,0.6)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', padding: '1rem',
                    }}>
                        <div className="glass-card" style={{ padding: '2rem', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</p>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                Cancel Policy?
                            </h3>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                This action cannot be undone. Your policy will be marked as cancelled.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <button
                                    onClick={() => setConfirmId(null)}
                                    style={{
                                        flex: 1, padding: '0.75rem',
                                        background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)',
                                        borderRadius: '0.625rem', color: '#94a3b8', fontFamily: 'inherit',
                                        fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
                                    }}
                                >
                                    Keep Policy
                                </button>
                                <button
                                    onClick={() => handleCancel(confirmId)}
                                    disabled={cancelling === confirmId}
                                    style={{
                                        flex: 1, padding: '0.75rem',
                                        background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                                        borderRadius: '0.625rem', color: '#f87171', fontFamily: 'inherit',
                                        fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                                    }}
                                >
                                    {cancelling === confirmId ? 'Cancelling…' : 'Yes, Cancel'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Endorsement Modal */}
                {endorsePolicy && (
                    <div style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
                        <div className="glass-card" style={{ padding:'2rem', maxWidth:'400px', width:'100%' }}>
                            <h3 style={{ fontWeight:800, color:'#e0e0ff', marginBottom:'0.25rem' }}>✏️ Request Policy Change</h3>
                            <p style={{ color:'#6868a0', fontSize:'0.8125rem', marginBottom:'1.25rem' }}>Policy #{endorsePolicy.number}</p>
                            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'#9898cc', marginBottom:'0.375rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Type of Change</label>
                            <select value={endorseType} onChange={e => setEndorseType(e.target.value)}
                                style={{ width:'100%', padding:'0.625rem 0.875rem', borderRadius:'0.625rem', border:'1px solid rgba(124,58,237,0.2)', background:'rgba(15,15,40,0.8)', color:'#e0e0ff', fontSize:'0.875rem', marginBottom:'1rem', fontFamily:'inherit' }}>
                                <option value="address_change">Address Change</option>
                                <option value="nominee_change">Nominee Change</option>
                                <option value="vehicle_change">Vehicle Change</option>
                                <option value="other">Other</option>
                            </select>
                            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'#9898cc', marginBottom:'0.375rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Details</label>
                            <textarea value={endorseDetails} onChange={e => setEndorseDetails(e.target.value)} rows={4}
                                placeholder="Describe the change you need…"
                                style={{ width:'100%', padding:'0.75rem', borderRadius:'0.625rem', border:'1px solid rgba(124,58,237,0.2)', background:'rgba(124,58,237,0.06)', color:'#e0e0ff', fontSize:'0.875rem', resize:'vertical', outline:'none', fontFamily:'inherit', boxSizing:'border-box', marginBottom:'1.25rem' }}
                            />
                            <div style={{ display:'flex', gap:'0.75rem' }}>
                                <button onClick={() => { setEndorsePolicy(null); setEndorseDetails(''); }}
                                    style={{ flex:1, padding:'0.625rem', borderRadius:'0.625rem', background:'transparent', border:'1px solid rgba(100,100,130,0.3)', color:'#9898cc', cursor:'pointer', fontSize:'0.875rem' }}>Cancel</button>
                                <button onClick={handleEndorse} disabled={!endorseDetails.trim() || endorseSending}
                                    style={{ flex:1, padding:'0.625rem', borderRadius:'0.625rem', background:'rgba(124,58,237,0.2)', border:'1px solid rgba(124,58,237,0.4)', color:'#c4b5fd', fontWeight:700, cursor:'pointer', fontSize:'0.875rem', opacity:(!endorseDetails.trim()||endorseSending)?0.5:1 }}>
                                    {endorseSending ? 'Submitting…' : 'Submit Request'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.375rem' }}>
                        My <span className="gradient-text">Policies</span>
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                        Manage your enrolled insurance policies.
                    </p>
                </div>

                {loading && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem 0' }}>
                        <div className="spinner" />
                    </div>
                )}

                {!loading && policies.length === 0 && (
                    <div className="glass-card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</p>
                        <p style={{ fontSize: '1.125rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '0.375rem' }}>
                            No policies yet
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.5rem' }}>
                            Browse our catalog and enroll in a policy to get started.
                        </p>
                        <button onClick={() => navigate('/policies')} className="btn-primary">
                            Browse Policies →
                        </button>
                    </div>
                )}

                {!loading && policies.length > 0 && (
                    <>
                        {/* Summary Bar */}
                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '1rem', marginBottom: '2rem',
                        }}>
                            {[
                                { label: 'Total Enrolled', value: policies.length, color: '#a5b4fc' },
                                { label: 'Active', value: active.length, color: '#22c55e' },
                                { label: 'Inactive', value: others.length, color: '#94a3b8' },
                            ].map((s) => (
                                <div key={s.label} className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</p>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Policy Cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {policies.map((up) => {
                                const statusStyle = STATUS_STYLES[up.status] || STATUS_STYLES.active;
                                const typeColor = TYPE_COLORS[up.policy?.policy_type] || '#818cf8';

                                return (
                                    <div
                                        key={up.id}
                                        className="glass-card animate-fade-in-up"
                                        style={{ padding: '1.5rem', borderLeft: `3px solid ${typeColor}` }}
                                    >
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                            {/* Left: Policy Info */}
                                            <div style={{ flex: 1, minWidth: '200px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                    <span style={{
                                                        fontSize: '0.6875rem', fontWeight: 700,
                                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                                        padding: '0.2rem 0.625rem', borderRadius: '0.375rem',
                                                        background: `${typeColor}18`, color: typeColor,
                                                    }}>
                                                        {up.policy?.policy_type || '—'}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.6875rem', fontWeight: 600,
                                                        padding: '0.2rem 0.625rem', borderRadius: '0.375rem',
                                                        background: statusStyle.bg, color: statusStyle.color,
                                                    }}>
                                                        {statusStyle.label}
                                                    </span>
                                                </div>
                                                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem' }}>
                                                    {up.policy?.title || 'Policy'}
                                                </h3>
                                                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                                                    {up.policy?.provider?.name} · #{up.policy_number}
                                                </p>
                                            </div>

                                            {/* Right: Metrics */}
                                            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                                {[
                                                    { label: 'Premium', value: up.premium ? formatCurrency(up.premium) + '/mo' : '—' },
                                                    { label: 'Start Date', value: formatDate(up.start_date) },
                                                    { label: 'End Date', value: formatDate(up.end_date) },
                                                ].map((m) => (
                                                    <div key={m.label} style={{ textAlign: 'center' }}>
                                                        <p style={{ fontSize: '0.6875rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.25rem' }}>
                                                            {m.label}
                                                        </p>
                                                        <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#e2e8f0' }}>
                                                            {m.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {up.status === 'active' && (
                                            <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => navigate(`/quote?policy_id=${up.policy_id}`)}
                                                    style={{ padding:'0.5rem 1rem', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'0.625rem', color:'#818cf8', fontSize:'0.8125rem', fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}
                                                >
                                                    Recalculate Quote
                                                </button>
                                                <button
                                                    onClick={() => handleGeneratePDF(up.id)}
                                                    disabled={pdfLoading === up.id}
                                                    style={{ padding:'0.5rem 1rem', background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.25)', borderRadius:'0.625rem', color:'#c4b5fd', fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                                                >
                                                    {pdfLoading === up.id ? '⏳ Generating…' : '📄 Download Policy'}
                                                </button>
                                                <button
                                                    onClick={() => handleRenew(up.id)}
                                                    disabled={renewLoading === up.id}
                                                    style={{ padding:'0.5rem 1rem', background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:'0.625rem', color:'#4ade80', fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                                                >
                                                    {renewLoading === up.id ? '⏳ Renewing…' : '🔄 Renew'}
                                                </button>
                                                <button
                                                    onClick={() => setEndorsePolicy({ id: up.id, number: up.policy_number })}
                                                    style={{ padding:'0.5rem 1rem', background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.25)', borderRadius:'0.625rem', color:'#fbbf24', fontSize:'0.8125rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
                                                >
                                                    ✏️ Request Change
                                                </button>
                                                <button
                                                    onClick={() => setConfirmId(up.id)}
                                                    style={{ padding:'0.5rem 1rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'0.625rem', color:'#f87171', fontSize:'0.8125rem', fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}
                                                >
                                                    Cancel Policy
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                            <button onClick={() => navigate('/policies')} className="btn-primary">
                                Browse More Policies →
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
