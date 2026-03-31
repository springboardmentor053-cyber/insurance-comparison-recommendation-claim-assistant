
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const STAT_CARDS = [
    { key: 'total_claims',     label: 'Total Claims',     icon: '📋', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { key: 'pending_action',   label: 'Needs Action',     icon: '⚡', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { key: 'total_claimed',    label: 'Total Claimed',    icon: '💰', color: 'bg-purple-50 text-purple-700 border-purple-200', money: true },
    { key: 'total_approved',   label: 'Total Approved',   icon: '✅', color: 'bg-green-50 text-green-700 border-green-200', money: true },
    { key: 'total_paid',       label: 'Total Paid Out',   icon: '🏦', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', money: true },
];

const STATUS_COLORS = {
    draft:        'bg-gray-100 text-gray-600',
    submitted:    'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    approved:     'bg-green-100 text-green-700',
    rejected:     'bg-red-100 text-red-600',
    paid:         'bg-emerald-100 text-emerald-700',
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentClaims, setRecentClaims] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Redirect non-admins immediately
        if (user && !user.is_admin) {
            navigate('/');
            return;
        }
        Promise.all([
            client.get('/claims/admin/stats'),
            client.get('/claims/admin/all'),
        ]).then(([statsRes, claimsRes]) => {
            setStats(statsRes.data);
            setRecentClaims(claimsRes.data.slice(0, 8)); // 8 most recent
        }).catch(console.error).finally(() => setLoading(false));
    }, [user]);

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fadeIn">

            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Welcome, <strong>{user?.name}</strong> · Claims Management Overview
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/claims')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition"
                >
                    Manage Claims →
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {STAT_CARDS.map(card => (
                        <div key={card.key} className={`rounded-2xl border p-4 ${card.color}`}>
                            <div className="text-2xl mb-1">{card.icon}</div>
                            <div className="text-xs font-bold uppercase tracking-wider opacity-70">{card.label}</div>
                            <div className="text-2xl font-bold mt-1">
                                {card.money
                                    ? `$${Number(stats[card.key] || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
                                    : stats[card.key] ?? 0
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Status Breakdown */}
            {stats && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-800 mb-4">Claims by Status</h2>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                        {Object.entries(stats.counts).map(([status, count]) => (
                            <div
                                key={status}
                                onClick={() => navigate('/admin/claims', { state: { filterStatus: status } })}
                                className={`rounded-xl p-3 text-center cursor-pointer hover:opacity-80 transition ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}
                            >
                                <div className="text-2xl font-bold">{count}</div>
                                <div className="text-xs font-semibold capitalize mt-0.5">{status.replace('_', ' ')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Claims Table */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">Recent Claims</h2>
                    <button onClick={() => navigate('/admin/claims')}
                        className="text-sm text-indigo-600 font-medium hover:underline">View all →</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                            <tr>
                                <th className="text-left px-4 py-3 font-semibold">Claim #</th>
                                <th className="text-left px-4 py-3 font-semibold">User</th>
                                <th className="text-left px-4 py-3 font-semibold">Policy</th>
                                <th className="text-left px-4 py-3 font-semibold">Amount</th>
                                <th className="text-left px-4 py-3 font-semibold">Status</th>
                                <th className="text-left px-4 py-3 font-semibold">Date</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentClaims.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-10 text-gray-400">No claims yet.</td>
                                </tr>
                            ) : recentClaims.map(claim => (
                                <tr key={claim.id} className="hover:bg-gray-50 transition">
                                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                        {claim.claim_number?.slice(0, 8)}...
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{claim.user?.name}</div>
                                        <div className="text-xs text-gray-400">{claim.user?.email}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-gray-700">{claim.policy?.title || '—'}</div>
                                        <div className="text-xs text-gray-400 capitalize">{claim.claim_type}</div>
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gray-800">
                                        ${Number(claim.amount_claimed).toLocaleString()}
                                        {claim.amount_approved && (
                                            <div className="text-xs text-green-600 font-normal">
                                                Approved: ${Number(claim.amount_approved).toLocaleString()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[claim.status] || 'bg-gray-100 text-gray-500'}`}>
                                            {claim.status?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-xs">
                                        {claim.incident_date}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => navigate('/admin/claims', { state: { selectedClaimId: claim.id } })}
                                            className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 font-bold rounded-lg hover:bg-indigo-100 transition"
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="font-bold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Submitted Claims', status: 'submitted', icon: '📤', btn: 'bg-blue-600' },
                        { label: 'Under Review', status: 'under_review', icon: '🔍', btn: 'bg-yellow-500' },
                        { label: 'Approved Claims', status: 'approved', icon: '✅', btn: 'bg-green-600' },
                        { label: 'Rejected Claims', status: 'rejected', icon: '❌', btn: 'bg-red-500' },
                    ].map(q => (
                        <button
                            key={q.status}
                            onClick={() => navigate('/admin/claims', { state: { filterStatus: q.status } })}
                            className={`${q.btn} text-white rounded-xl p-4 text-left hover:opacity-90 transition`}
                        >
                            <div className="text-2xl mb-1">{q.icon}</div>
                            <div className="text-xs font-bold">{q.label}</div>
                            <div className="text-lg font-bold mt-1">{stats?.counts?.[q.status] ?? 0}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
