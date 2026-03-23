
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const STATUS_OPTIONS = ['all', 'submitted', 'under_review', 'approved', 'rejected', 'paid', 'draft'];

const STATUS_COLORS = {
    draft:        'bg-gray-100 text-gray-600',
    submitted:    'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    approved:     'bg-green-100 text-green-700',
    rejected:     'bg-red-100 text-red-600',
    paid:         'bg-emerald-100 text-emerald-700',
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
    const [search, setSearch] = useState('');
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [fullClaim, setFullClaim] = useState(null);
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
        const res = await client.get(`/claims/admin/${id}`);
        setSelectedClaim(id);
        setFullClaim(res.data);
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Claims Queue</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Review, approve and settle insurance claims</p>
                </div>
                <button onClick={() => navigate('/admin/dashboard')}
                    className="text-sm text-indigo-600 font-medium hover:underline">← Dashboard</button>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map(s => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                                filterStatus === s
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {STATUS_ICONS[s] || '📋'} {s.replace('_', ' ')}
                            {s !== 'all' && countByStatus[s] ? ` (${countByStatus[s]})` : ''}
                            {s === 'all' ? ` (${claims.length})` : ''}
                        </button>
                    ))}
                    <input
                        type="text"
                        placeholder="Search name, email, claim..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-200 outline-none"
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
                            className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition ${
                                selectedClaim === claim.id ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* User + claim number */}
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 flex-shrink-0 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
                                            {claim.user?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <span className="font-semibold text-gray-900 text-sm">{claim.user?.name}</span>
                                            <span className="text-gray-400 text-xs ml-1.5">{claim.user?.email}</span>
                                        </div>
                                    </div>
                                    {/* Policy + type */}
                                    <div className="mt-1.5 ml-9">
                                        <span className="text-xs text-gray-500">{claim.policy?.title || claim.claim_type}</span>
                                        <span className="mx-1.5 text-gray-300">·</span>
                                        <span className="font-mono text-xs text-gray-400">{claim.claim_number?.slice(0, 8)}...</span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[claim.status]}`}>
                                        {STATUS_ICONS[claim.status]} {claim.status?.replace('_', ' ')}
                                    </span>
                                    <span className="font-bold text-sm text-gray-900">₹{Number(claim.amount_claimed).toLocaleString()}</span>
                                    {claim.amount_approved && (
                                        <span className="text-xs text-green-600 font-medium">✓ ₹{Number(claim.amount_approved).toLocaleString()}</span>
                                    )}
                                </div>
                            </div>
                            <div className="mt-2 ml-9 text-xs text-gray-400">Incident: {claim.incident_date}</div>
                        </div>
                    ))}
                </div>

                {/* ── Claim Detail Panel ─────── */}
                {fullClaim && (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden self-start sticky top-4">
                        {/* Panel header */}
                        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="font-bold text-gray-900">Claim Details</h2>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{fullClaim.claim_number}</p>
                            </div>
                            <button onClick={() => { setFullClaim(null); setSelectedClaim(null); }}
                                className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
                        </div>

                        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

                            {/* User info */}
                            <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-3">
                                <div className="h-10 w-10 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                                    {fullClaim.user_id}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">User ID: {fullClaim.user_id}</div>
                                    <div className="text-xs text-gray-500 capitalize">{fullClaim.claim_type} Claim</div>
                                </div>
                                <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-full capitalize ${STATUS_COLORS[fullClaim.status]}`}>
                                    {STATUS_ICONS[fullClaim.status]} {fullClaim.status?.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Claim data grid */}
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {[
                                    ['Incident Date', fullClaim.incident_date],
                                    ['Amount Claimed', `₹${Number(fullClaim.amount_claimed).toLocaleString()}`],
                                    ['Amount Approved', fullClaim.amount_approved ? `₹${Number(fullClaim.amount_approved).toLocaleString()}` : '—'],
                                    ['Claim Type', fullClaim.claim_type],
                                    ...(fullClaim.hospital_name ? [['Hospital', fullClaim.hospital_name]] : []),
                                    ...(fullClaim.incident_location ? [['Location', fullClaim.incident_location]] : []),
                                    ...(fullClaim.police_report_number ? [['Police Report', fullClaim.police_report_number]] : []),
                                    ...(fullClaim.third_party_involved ? [['Third Party', fullClaim.third_party_involved]] : []),
                                    ...(fullClaim.beneficiary_name ? [['Beneficiary', fullClaim.beneficiary_name]] : []),
                                    ...(fullClaim.cause ? [['Cause', fullClaim.cause]] : []),
                                ].map(([k, v]) => (
                                    <div key={k} className="bg-gray-50 rounded-lg p-2.5">
                                        <div className="text-xs text-gray-400 font-medium">{k}</div>
                                        <div className="font-semibold text-gray-800 mt-0.5 text-sm">{v}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            <div className="bg-gray-50 rounded-xl p-3">
                                <div className="text-xs text-gray-400 font-medium mb-1">Incident Description</div>
                                <p className="text-sm text-gray-700 leading-relaxed">{fullClaim.incident_description}</p>
                            </div>

                            {/* Claim History Timeline */}
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-4">Claim Timeline</div>
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
                                <div>
                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">
                                        Supporting Documents ({fullClaim.documents.length})
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
                            <div className="border-t border-gray-100 pt-4 space-y-3">
                                <div className="text-xs font-bold text-gray-500 uppercase">Admin Actions</div>

                                {fullClaim.status === 'submitted' && (
                                    <button
                                        onClick={() => callAction(`/claims/admin/${fullClaim.id}/review`)}
                                        disabled={actionLoading}
                                        className="w-full py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition"
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
                                        <div className="grid grid-cols-2 gap-2">
                                            {fullClaim.status === 'under_review' && (
                                                <button
                                                    onClick={() => callAction(`/claims/admin/${fullClaim.id}/approve`, {
                                                        amount_approved: parseFloat(approveAmount),
                                                        admin_notes: adminNote
                                                    })}
                                                    disabled={actionLoading || !approveAmount}
                                                    className="py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm disabled:opacity-40 transition"
                                                >
                                                    ✅ Approve Claim
                                                </button>
                                            )}
                                            <button
                                                onClick={() => callAction(`/claims/admin/${fullClaim.id}/reject`, { admin_notes: adminNote })}
                                                disabled={actionLoading}
                                                className={`py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-sm disabled:opacity-40 transition ${fullClaim.status === 'submitted' ? 'col-span-2' : ''}`}
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
        </div>
    );
};

export default AdminClaims;
