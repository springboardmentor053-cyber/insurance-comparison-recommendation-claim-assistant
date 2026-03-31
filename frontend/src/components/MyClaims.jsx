
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';

const STATUS_INFO = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: '📝', description: 'Not submitted yet. You can still edit.' },
    submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: '📤', description: 'Awaiting admin review.' },
    under_review: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700', icon: '🔍', description: 'Our team is processing your claim.' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: '✅', description: 'Your claim has been approved.' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: '❌', description: 'Your claim was rejected.' },
    paid: { label: 'Paid', color: 'bg-emerald-100 text-emerald-700', icon: '💰', description: 'Amount disbursed.' },
};

const MyClaims = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const successMessage = location.state?.successMessage;
    const claimNumber = location.state?.claimNumber;

    useEffect(() => {
        client.get('/claims/my')
            .then(r => setClaims(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Success banner */}
            {successMessage && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                        <p className="font-bold text-green-800">{successMessage}</p>
                        {claimNumber && <p className="text-green-600 text-sm mt-0.5">Claim Number: <strong>{claimNumber}</strong></p>}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Claims</h1>
                    <p className="text-gray-500 text-sm mt-1">Track all your insurance claims.</p>
                </div>
                <button onClick={() => navigate('/my-policies')}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-lg hover:bg-red-600 transition">
                    + New Claim
                </button>
            </div>

            {claims.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="text-5xl mb-4">📋</div>
                    <h3 className="text-lg font-bold text-gray-700">No Claims Yet</h3>
                    <p className="text-gray-400 text-sm mt-2 mb-6">Go to My Policies to file a claim.</p>
                    <button onClick={() => navigate('/my-policies')}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
                        Go to My Policies
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {claims.map(claim => {
                        const si = STATUS_INFO[claim.status] || STATUS_INFO.draft;
                        return (
                            <div key={claim.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition overflow-hidden">
                                <div className="p-5 flex flex-col md:flex-row justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${si.color}`}>
                                                {si.icon} {si.label}
                                            </span>
                                            <span className="text-xs text-gray-400 uppercase font-semibold">{claim.claim_type}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 font-mono">{claim.claim_number}</p>
                                        <p className="text-xs text-gray-500 mt-1">{si.description}</p>
                                        <div className="mt-2 text-sm grid grid-cols-2 gap-x-4 gap-y-1 text-gray-600">
                                            <div><span className="font-medium">Incident:</span> {claim.incident_date}</div>
                                            <div><span className="font-medium">Claimed:</span> ₹{claim.amount_claimed}</div>
                                            {claim.amount_approved && (
                                                <div><span className="font-medium text-green-700">Approved:</span> <span className="text-green-700 font-bold">₹{claim.amount_approved}</span></div>
                                            )}
                                        </div>
                                        {claim.admin_notes && (
                                            <div className="mt-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600">
                                                <span className="font-medium">Admin Note:</span> {claim.admin_notes}
                                            </div>
                                        )}
                                    </div>
                                    {/* Draft actions */}
                                    {claim.status === 'draft' && (
                                        <div className="flex flex-col gap-2 justify-center">
                                            <button
                                                onClick={() => navigate(`/claims/${claim.id}/edit`)}
                                                className="px-4 py-2 text-sm border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition">
                                                Continue Editing
                                            </button>
                                        </div>
                                    )}
                                </div>
                                {/* Status Timeline */}
                                <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Claim History Timeline</h4>
                                    <div className="space-y-3">
                                        {claim.history && claim.history.length > 0 ? (
                                            claim.history.map((h, i) => {
                                                const hInfo = STATUS_INFO[h.status] || STATUS_INFO.draft;
                                                return (
                                                    <div key={h.id} className="flex gap-3 relative">
                                                        {i !== claim.history.length - 1 && (
                                                            <div className="absolute top-6 left-2.5 bottom-[-16px] w-[2px] bg-gray-200"></div>
                                                        )}
                                                        <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-[10px] z-10 ${hInfo.color} ring-4 ring-white`}>
                                                            {hInfo.icon}
                                                        </div>
                                                        <div className="flex-1 pb-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-bold text-gray-800 capitalize">{h.status.replace('_', ' ')}</span>
                                                                <span className="text-xs text-gray-400 font-mono">
                                                                    {new Date(h.changed_at).toLocaleDateString()} {new Date(h.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            {h.notes && <p className="text-xs text-gray-500 mt-0.5">{h.notes}</p>}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex gap-3 relative">
                                                <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-[10px] z-10 ${si.color} ring-4 ring-white`}>
                                                    {si.icon}
                                                </div>
                                                <div className="flex-1 pb-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-gray-800 capitalize">{claim.status.replace('_', ' ')}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-0.5">Timeline history unavailable for generic states.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyClaims;
