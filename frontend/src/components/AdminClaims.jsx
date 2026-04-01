
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const STATUS_OPTIONS = ['all', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'draft'];

const STATUS_COLORS = {
    draft:        'bg-gray-100 text-black border-gray-200',
    submitted:    'bg-gray-100 text-black border-gray-300 shadow-sm font-extrabold',
    under_review: 'bg-indigo-100 text-black border-indigo-200 shadow-sm font-extrabold',
    approved:     'bg-green-100 text-black border-green-200 shadow-sm font-extrabold',
    rejected:     'bg-red-100 text-black border-red-200 shadow-sm font-extrabold',
    paid:         'bg-emerald-100 text-black border-emerald-200 shadow-sm font-extrabold',
};

const STATUS_ICONS = {
    draft: '📝', submitted: '📤', under_review: '🔍',
    approved: '✅', rejected: '❌', paid: '💰',
};

const AdminClaims = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [claims, setClaims] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState(location.state?.filterStatus || 'all');
    const [showFlaggedOnly, setShowFlaggedOnly] = useState(location.state?.hasFlags || false);
    const [search, setSearch] = useState('');
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [fullClaim, setFullClaim] = useState(null);
    const [showFraudDetails, setShowFraudDetails] = useState(false);
    const [showFraudModal, setShowFraudModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [approveAmount, setApproveAmount] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user && !user.is_admin) { navigate('/'); return; }
        fetchClaims();
    }, [user]);

    useEffect(() => {
        // Auto-select from dashboard navigation
        if (location.state?.selectedClaimId && claims.length) {
            const c = claims.find(x => x.id === location.state.selectedClaimId);
            if (c) fetchFullClaim(c.id);
        }
    }, [claims, location.state]);

    useEffect(() => {
        let result = claims;
        if (filterStatus !== 'all') result = result.filter(c => c.status === filterStatus);
        
        if (showFlaggedOnly) {
            result = result.filter(c => c.fraud_flags?.length > 0 && ['submitted', 'under_review'].includes(c.status));
        }

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                c.claim_number?.toLowerCase().includes(q) ||
                c.user?.name?.toLowerCase().includes(q) ||
                c.user?.email?.toLowerCase().includes(q) ||
                c.policy?.title?.toLowerCase().includes(q)
            );
        }
        setFiltered(result);
    }, [claims, filterStatus, search]);

    const fetchClaims = () => {
        setLoading(true);
        client.get('/claims/admin/all')
            .then(r => setClaims(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const fetchFullClaim = async (id) => {
        setError(''); setSuccess('');
        setApproveAmount(''); setAdminNote('');
        setShowFraudDetails(false);
        try {
            const res = await client.get(`/claims/admin/${id}`);
            setSelectedClaim(id);
            setFullClaim(res.data);
        } catch (e) {
            console.error(e);
            setError("Failed to load claim details. The server might be experiencing an issue.");
            setFullClaim(null);
        }
    };

    const callAction = async (endpoint, payload = {}) => {
        setActionLoading(true); setError(''); setSuccess('');
        try {
            await client.put(endpoint, payload);
            setSuccess('✅ Action completed successfully!');
            fetchClaims();
            fetchFullClaim(selectedClaim);
        } catch (e) {
            setError(e.response?.data?.detail || 'Action failed.');
        } finally {
            setActionLoading(false);
        }
    };

    // Count per status for filter tabs
    const countByStatus = claims.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-5 animate-fadeIn">

            {/* Header */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-[-50%] right-[-10%] w-96 h-96 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Active Claims Queue</h1>
                    <p className="text-gray-500 text-sm mt-1.5 font-medium">Review, approve, and settle insurance claims</p>
                </div>
                <button onClick={() => navigate('/admin/dashboard')}
                    className="relative z-10 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold rounded-xl text-sm transition shadow-sm">
                    ← Back to Dashboard
                </button>
            </div>

            {/* Filter Controls */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="flex gap-2 flex-wrap items-center">
                    {STATUS_OPTIONS.map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all duration-200 border ${
                                filterStatus === s
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                                    : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/50'
                            }`}
                        >
                            {STATUS_ICONS[s] || '📋'} {s.replace('_', ' ')}
                            {s !== 'all' && countByStatus[s] ? ` (${countByStatus[s]})` : ''}
                            {s === 'all' ? ` (${claims.length})` : ''}
                        </button>
                    ))}
                    <div className="hidden sm:block w-px h-8 bg-gray-200 mx-1"></div>
                    <button
                        onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border ${
                            showFlaggedOnly 
                                ? 'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/30' 
                                : 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                        }`}
                    >
                        {showFlaggedOnly ? <span className="animate-pulse">🚨</span> : '🚨'} 
                        {showFlaggedOnly ? 'Active Alerts Only' : 'Filter by Alerts'}
                    </button>
                </div>
                <div className="relative w-full xl:w-72">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search claims..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition shadow-sm"
                    />
                </div>
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}
            {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{success}</div>}

            <div className={`grid gap-5 ${fullClaim ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>

                {/* ── Claims List ─────────────── */}
                <div className="space-y-2 min-w-0">
                    {loading ? (
                        <div className="py-10 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div></div>
                    ) : filtered.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
                            No claims found for this filter.
                        </div>
                    ) : filtered.map(claim => (
                        <div
                            key={claim.id}
                            onClick={() => fetchFullClaim(claim.id)}
                            className={`group bg-white rounded-2xl p-5 cursor-pointer transition-all duration-300 border-2 ${
                                selectedClaim === claim.id 
                                    ? 'border-indigo-500 shadow-md shadow-indigo-500/10 scale-[1.01]' 
                                    : 'border-transparent shadow-sm hover:shadow-md hover:border-indigo-100 border-gray-100 hover:scale-[1.01]'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* User profile */}
                                    <div className="flex items-center gap-3">
                                        <div className={`h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border transition-colors ${
                                            selectedClaim === claim.id ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                        }`}>
                                            {claim.user?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="font-bold text-gray-900 text-sm">{claim.user?.name}</span>
                                                {claim.fraud_flags?.length > 0 && ['submitted', 'under_review'].includes(claim.status) && (
                                                    <span className="flex h-2.5 w-2.5 relative" title="Active Fraud Alerts">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                                    </span>
                                                )}
                                                {claim.fraud_flags?.length > 0 && !['submitted', 'under_review'].includes(claim.status) && (
                                                    <span className="text-gray-400 text-[10px]" title="Resolved / Historical Flag">🛡️</span>
                                                )}
                                            </div>
                                            <span className="text-gray-500 text-xs">{claim.user?.email}</span>
                                        </div>
                                    </div>
                                    {/* Policy badge */}
                                    <div className="mt-4 ml-[52px] flex items-center gap-2">
                                        <span className="text-[10px] font-bold tracking-widest text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md uppercase">{claim.policy?.title || claim.claim_type}</span>
                                        <span className="text-gray-300">•</span>
                                        <span className="font-mono text-xs text-gray-400 tracking-wider">#{claim.claim_number?.slice(0, 8)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest border transition-colors ${STATUS_COLORS[claim.status]}`}>
                                        {STATUS_ICONS[claim.status]} {claim.status?.replace('_', ' ')}
                                    </span>
                                    <div className="text-right">
                                        <span className="block font-bold text-sm text-gray-900">₹{Number(claim.amount_claimed).toLocaleString('en-IN')}</span>
                                        {claim.amount_approved && (
                                            <span className="block text-[10px] uppercase font-bold text-black mt-1.5 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">✓ ₹{Number(claim.amount_approved).toLocaleString('en-IN')}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 ml-[52px] text-[10px] font-bold tracking-wider text-gray-400 uppercase flex justify-between items-center border-t border-gray-50 pt-3 transition-colors">
                                <span>{claim.incident_date}</span>
                                <span className={`text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity ${selectedClaim === claim.id ? 'opacity-100' : ''}`}>Review Claim →</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Claim Detail Panel ─────── */}
                {fullClaim && (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl overflow-hidden self-start sticky top-4 mb-10">
                        {/* Panel header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-sm font-bold text-black uppercase tracking-widest flex items-center gap-2">
                                    Claim Details
                                    {fullClaim.fraud_flags?.length > 0 && ['submitted', 'under_review'].includes(fullClaim.status) && (
                                        <button 
                                            onClick={() => setShowFraudModal(true)}
                                            className="relative p-1 hover:bg-red-50 rounded-full transition-colors group cursor-pointer"
                                            title={`${fullClaim.fraud_flags.length} active fraud alert(s)`}
                                        >
                                            <span className="animate-ping absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                                            <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500 border border-white"></span>
                                            <span className="text-lg group-hover:scale-110 transition-transform">🚨</span>
                                        </button>
                                    )}
                                </h2>
                                <p className="text-xs text-indigo-400 font-mono mt-1 tracking-wider">{fullClaim.claim_number}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => { setFullClaim(null); setSelectedClaim(null); }}
                                    className="h-8 w-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 flex items-center justify-center transition font-bold text-sm">✕</button>
                            </div>
                        </div>

                        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

                            {/* User info */}
                            <div className="flex items-center gap-4 bg-indigo-50 rounded-2xl p-5 border border-indigo-100/50">
                                <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center text-indigo-700 font-bold text-lg flex-shrink-0 shadow-sm border border-indigo-100">
                                    {fullClaim.user_id}
                                </div>
                                <div>
                                    <div className="font-extrabold text-black text-base tracking-wide">User ID: {fullClaim.user_id}</div>
                                    <div className="text-xs text-indigo-500 capitalize tracking-wider">{fullClaim.claim_type} Insurance</div>
                                </div>
                                <span className={`ml-auto text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border shadow-sm ${
                                    fullClaim.status === 'submitted' ? 'bg-gray-100 text-black border-gray-300' :
                                    fullClaim.status === 'under_review' ? 'bg-indigo-100 text-black border-indigo-200' :
                                    fullClaim.status === 'approved' ? 'bg-green-100 text-black border-green-200' :
                                    fullClaim.status === 'paid' ? 'bg-emerald-100 text-black border-emerald-200' :
                                    'bg-red-100 text-black border-red-200'
                                }`}>
                                    {STATUS_ICONS[fullClaim.status]} {fullClaim.status?.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Claim data grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                                {[
                                    ['Incident Date', fullClaim.incident_date],
                                    ['Amount Claimed', `₹${Number(fullClaim.amount_claimed).toLocaleString('en-IN')}`],
                                    ['Amount Approved', fullClaim.amount_approved ? `₹${Number(fullClaim.amount_approved).toLocaleString('en-IN')}` : '—'],
                                    ['Claim Type', fullClaim.claim_type],
                                    ...(fullClaim.hospital_name ? [['Hospital', fullClaim.hospital_name]] : []),
                                    ...(fullClaim.incident_location ? [['Location', fullClaim.incident_location]] : []),
                                    ...(fullClaim.police_report_number ? [['Police Report', fullClaim.police_report_number]] : []),
                                    ...(fullClaim.third_party_involved ? [['Third Party', fullClaim.third_party_involved]] : []),
                                    ...(fullClaim.beneficiary_name ? [['Beneficiary', fullClaim.beneficiary_name]] : []),
                                    ...(fullClaim.cause ? [['Cause', fullClaim.cause]] : []),
                                ].map(([k, v]) => (
                                    <div key={k} className="bg-white border border-gray-100 shadow-sm rounded-xl p-3 hover:shadow-md transition-shadow">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{k}</div>
                                        <div className="font-extrabold text-gray-800 mt-1 text-sm">{v}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 relative overflow-hidden mt-2">
                                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 ml-2">Incident Description</div>
                                <p className="text-sm text-gray-700 leading-relaxed ml-2">{fullClaim.incident_description}</p>
                            </div>



                            {/* Claim History Timeline */}
                            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-5 mt-4">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <span className="text-indigo-400">⏱️</span> Claim Timeline
                                </div>
                                <div className="space-y-4">
                                    {fullClaim.history?.length > 0 ? (
                                        fullClaim.history.map((h, i) => {
                                            const hInfo = STATUS_ICONS[h.status] || '📋';
                                            const hColor = STATUS_COLORS[h.status] || 'bg-gray-100 text-gray-500';
                                            return (
                                                <div key={h.id} className="flex gap-3 relative">
                                                    {i !== fullClaim.history.length - 1 && (
                                                        <div className="absolute top-7 left-3.5 bottom-[-20px] w-0.5 bg-gray-200"></div>
                                                    )}
                                                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs z-10 flex-shrink-0 ${hColor} ring-4 ring-gray-50`}>
                                                        {hInfo}
                                                    </div>
                                                    <div className="flex-1 pb-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-bold text-gray-800 capitalize">{h.status.replace('_', ' ')}</span>
                                                            <span className="text-[10px] text-gray-400 font-mono">
                                                                {new Date(h.changed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                            </span>
                                                        </div>
                                                        {h.notes && <p className="text-xs text-gray-600 mt-1 bg-white border border-gray-100 rounded p-2">{h.notes}</p>}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-xs text-gray-400">Timeline history not available.</div>
                                    )}
                                </div>
                            </div>

                            {/* Documents */}
                            {fullClaim.documents?.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <span className="text-indigo-400">📎</span> Supporting Documents ({fullClaim.documents.length})
                                    </div>
                                    <div className="space-y-2">
                                        {fullClaim.documents.map(d => {
                                            const isImage = !d.file_url.toLowerCase().includes('.pdf');
                                            return (
                                            <a
                                                key={d.id}
                                                href={d.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg px-3 py-2.5 transition group"
                                            >
                                                {isImage ? (
                                                    <img src={d.file_url} alt={d.doc_type} className="w-10 h-10 object-cover rounded shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 flex items-center justify-center bg-indigo-200 rounded text-xs font-bold text-indigo-700">PDF</div>
                                                )}
                                                <div className="flex-1">
                                                    <span className="text-indigo-700 font-semibold text-sm capitalize block">
                                                        {d.doc_type?.replace('_', ' ')}
                                                    </span>
                                                    <div className="text-xs text-indigo-400 mt-0.5">Click to open in S3 ↗</div>
                                                </div>
                                                <span className="text-indigo-500 text-lg group-hover:text-indigo-700">📎</span>
                                            </a>
                                        )})}
                                    </div>
                                </div>
                            )}

                            {/* ─── Admin Action Panel ─── */}
                            <div className="bg-gradient-to-b from-gray-50 to-white border border-gray-200 shadow-inner rounded-2xl p-5 mt-6 space-y-4">
                                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                    <span className="text-indigo-500 text-sm">⚡</span> Required Actions
                                </div>

                                {fullClaim.status === 'submitted' && (
                                    <button
                                        onClick={() => callAction(`/claims/admin/${fullClaim.id}/review`)}
                                        disabled={actionLoading}
                                        className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 shadow-md shadow-yellow-500/20 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-all hover:-translate-y-0.5"
                                    >
                                        🔍 Start Review
                                    </button>
                                )}

                                {['submitted', 'under_review'].includes(fullClaim.status) && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-gray-600">Approved Amount (₹) *</label>
                                        <input
                                            type="number"
                                            placeholder="Enter amount to approve..."
                                            value={approveAmount}
                                            onChange={e => setApproveAmount(e.target.value)}
                                            disabled={fullClaim.status !== 'under_review'}
                                            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-green-300 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                        />
                                        <label className="text-xs font-medium text-gray-600">Note / Reason</label>
                                        <textarea
                                            placeholder="Add a note (required for rejection)..."
                                            value={adminNote}
                                            onChange={e => setAdminNote(e.target.value)}
                                            rows={2}
                                            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-gray-300 outline-none resize-none"
                                        />
                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            {fullClaim.status === 'under_review' && (
                                                <button
                                                    onClick={() => callAction(`/claims/admin/${fullClaim.id}/approve`, {
                                                        amount_approved: parseFloat(approveAmount),
                                                        admin_notes: adminNote
                                                    })}
                                                    disabled={actionLoading || !approveAmount}
                                                    className="py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-md shadow-green-500/20 text-white font-bold rounded-xl text-sm disabled:opacity-40 transition-all hover:-translate-y-0.5"
                                                >
                                                    ✅ Approve Claim
                                                </button>
                                            )}
                                            <button
                                                onClick={() => callAction(`/claims/admin/${fullClaim.id}/reject`, { admin_notes: adminNote })}
                                                disabled={actionLoading}
                                                className={`py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md shadow-red-500/20 text-white font-bold rounded-xl text-sm disabled:opacity-40 transition-all hover:-translate-y-0.5 ${fullClaim.status === 'submitted' ? 'col-span-2' : ''}`}
                                            >
                                                ❌ Reject Claim
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {fullClaim.status === 'approved' && (
                                    <button
                                        onClick={() => callAction(`/claims/admin/${fullClaim.id}/pay`)}
                                        disabled={actionLoading}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition"
                                    >
                                        💰 Mark as Paid — ₹{Number(fullClaim.amount_approved || 0).toLocaleString()}
                                    </button>
                                )}

                                {['rejected', 'paid'].includes(fullClaim.status) && (
                                    <div className="text-center py-3 text-sm text-gray-400 bg-gray-50 rounded-xl">
                                        {fullClaim.status === 'paid' ? '✅ This claim has been settled.' : '🚫 This claim has been rejected.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Fraud Details Modal */}
            {showFraudModal && fullClaim?.fraud_flags && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
                        <div className="px-6 py-5 border-b border-red-100 bg-red-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl shadow-sm border border-red-200">
                                    🚨
                                </div>
                                <div>
                                    <h2 className="font-bold text-red-800 text-lg">Fraud Alerts Detected</h2>
                                    <p className="text-xs text-red-600">{fullClaim.fraud_flags.length} rule(s) triggered</p>
                                </div>
                            </div>
                            <button onClick={() => setShowFraudModal(false)} className="h-8 w-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-full flex items-center justify-center transition font-bold text-xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4">
                            {fullClaim.fraud_flags.map((flag, idx) => (
                                <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                        flag.severity === 'critical' ? 'bg-red-600' :
                                        flag.severity === 'high' ? 'bg-orange-500' :
                                        flag.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                                    }`}></div>
                                    <div className="pl-3">
                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                            <span className="font-bold text-gray-900">{flag.rule_code.replace(/_/g, ' ')}</span>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                                                flag.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                                flag.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                                flag.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                            }`}>{flag.severity} Severity</span>
                                        </div>
                                        <div className="text-sm text-gray-600 leading-relaxed">{flag.details}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-right">
                            <button onClick={() => setShowFraudModal(false)} className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-sm transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminClaims;
