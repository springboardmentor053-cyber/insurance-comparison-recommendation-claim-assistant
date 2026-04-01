
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const STAT_CARDS = [
    { key: 'total_claims',     label: 'Total Claims',     icon: '📋', accent: 'bg-blue-500' },
    { key: 'flagged_claims',   label: 'Fraud Alerts',     icon: '🚨', accent: 'bg-red-500' },
    { key: 'approved_count',   label: 'Approved Claims',  icon: '✅', accent: 'bg-green-500' },
    { key: 'rejected_count',   label: 'Rejected Claims',  icon: '❌', accent: 'bg-gray-500' },
    { key: 'pending_action',   label: 'Needs Action',     icon: '⚡', accent: 'bg-amber-500' },
    { key: 'total_claimed',    label: 'Total Claimed',    icon: '💰', accent: 'bg-purple-500', money: true },
    { key: 'total_approved',   label: 'Approved Amount',  icon: '💵', accent: 'bg-teal-500', money: true },
    { key: 'total_paid',       label: 'Total Paid Out',   icon: '🏦', accent: 'bg-emerald-500', money: true },
];

const STATUS_COLORS = {
    draft:        'bg-gray-100 text-gray-600',
    submitted:    'bg-blue-100 text-blue-700',
    under_review: 'bg-yellow-100 text-yellow-700',
    approved:     'bg-green-100 text-green-700',
    rejected:     'bg-red-100 text-red-600',
    paid:         'bg-emerald-100 text-emerald-700',
};

const STATUS_ICONS = {
    draft: '📝',
    submitted: '📤',
    under_review: '⏳',
    approved: '✅',
    rejected: '❌',
    paid: '💸'
};

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentClaims, setRecentClaims] = useState([]);
    const [fraudFlags, setFraudFlags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showExport, setShowExport] = useState(false);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const handleExportCSV = async () => {
        try {
            const params = {};
            if (fromDate) params.from_date = fromDate;
            if (toDate) params.to_date = toDate;

            const response = await client.get('/claims/admin/export/claims.csv', {
                params,
                responseType: 'blob',   // ← get raw file bytes
            });

            // Build filename from date range
            const label = `${fromDate || 'all'}_to_${toDate || 'all'}`;
            const filename = `claims_${label}.csv`;

            // Trigger browser download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setShowExport(false);
        } catch (err) {
            alert('Failed to export CSV. Make sure you are logged in as admin.');
        }
    };

    useEffect(() => {
        if (user && !user.is_admin) {
            navigate('/');
            return;
        }
        Promise.all([
            client.get('/claims/admin/stats'),
            client.get('/claims/admin/all'),
            client.get('/claims/admin/fraud-flags'),
        ]).then(([statsRes, claimsRes, fraudRes]) => {
            setStats(statsRes.data);
            setRecentClaims(claimsRes.data.slice(0, 8));
            setFraudFlags(fraudRes.data.slice(0, 10));
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
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative gap-6">
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px] font-bold font-mono border border-green-200 tracking-widest">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            SYSTEM LIVE
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Admin Control Center</h1>
                    <p className="text-gray-500 text-sm mt-1.5 font-medium">
                        Welcome back, <span className="text-indigo-600 font-bold">{user?.name}</span> · Operational Dashboard
                    </p>
                </div>
                <div className="flex gap-3 items-center relative z-10 w-full md:w-auto">
                    <div className="relative w-full md:w-auto">
                        <button
                            onClick={() => setShowExport(v => !v)}
                            className="w-full md:w-auto px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm"
                        >
                            <span className="opacity-80">☁️</span> Export Data
                        </button>
                        {showExport && (
                            <div className="absolute right-0 top-14 z-50 bg-white border border-gray-100 rounded-2xl shadow-2xl p-5 w-80 text-gray-800">
                                <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-widest">Date Range (Optional)</p>
                                <div className="space-y-3 mb-5">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">From Date</label>
                                        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition shadow-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 mb-1.5 block">To Date</label>
                                        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition shadow-sm" />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleExportCSV}
                                        className="flex-1 bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-slate-800 transition shadow-md">
                                        Download CSV
                                    </button>
                                    <button onClick={() => { setFromDate(''); setToDate(''); setShowExport(false); }}
                                        className="px-4 py-2.5 text-xs font-semibold text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition">
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/admin/claims')}
                        className="w-full md:w-auto px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-500/20"
                    >
                        Manage Claims →
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                    {STAT_CARDS.map(card => (
                        <div key={card.key} className={`relative bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden ${
                            card.key === 'flagged_claims' ? 'cursor-pointer hover:-translate-y-1' : ''
                        }`}
                            onClick={card.key === 'flagged_claims' ? () => navigate('/admin/claims', { state: { hasFlags: true } }) : undefined}
                        >
                            <div className={`absolute top-0 left-0 w-full h-1 ${card.accent} opacity-80`}></div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</div>
                                <div className={`text-2xl transition-all duration-300 ${card.key === 'flagged_claims' ? 'animate-pulse' : 'opacity-70 group-hover:opacity-100'}`}>{card.icon}</div>
                            </div>
                            <div className="text-3xl font-extrabold text-slate-800 tracking-tight">
                                {card.money
                                    ? `₹${Number(stats[card.key] || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
                                    : stats[card.key] ?? 0
                                }
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Status Breakdown */}
            {stats && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-gray-800 mb-5 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-indigo-500">📊</span> Pipeline Status
                    </h2>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {Object.entries(stats.counts).map(([status, count]) => (
                            <div
                                key={status}
                                onClick={() => navigate('/admin/claims', { state: { filterStatus: status } })}
                                className="group relative rounded-2xl p-4 text-center cursor-pointer overflow-hidden border border-gray-100 hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-1 bg-gradient-to-b from-white to-gray-50/50"
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${STATUS_COLORS[status] || 'bg-gray-500'}`}></div>
                                <div className="relative z-10 text-3xl font-extrabold text-slate-800 mb-1">{count}</div>
                                <div className="relative z-10 text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-gray-900 transition-colors">{status.replace('_', ' ')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Claims Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <span className="text-indigo-500">⚡</span> Live Incoming Queue
                    </h2>
                    <button onClick={() => navigate('/admin/claims')}
                        className="text-xs text-indigo-600 font-bold uppercase tracking-wider hover:text-indigo-800 transition">View Full Queue →</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-white text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-gray-50">
                            <tr>
                                <th className="text-left px-6 py-4">Claim ID</th>
                                <th className="text-left px-6 py-4">Applicant</th>
                                <th className="text-left px-6 py-4">Coverage</th>
                                <th className="text-right px-6 py-4">Requested Amt</th>
                                <th className="text-left px-6 py-4">Current Status</th>
                                <th className="text-left px-6 py-4">Date</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentClaims.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">No recent claims found.</td>
                                </tr>
                            ) : recentClaims.map(claim => (
                                <tr key={claim.id} className="hover:bg-gray-50/80 transition duration-150 cursor-pointer group" onClick={() => navigate('/admin/claims', { state: { selectedClaimId: claim.id }})}>
                                    <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-semibold">{claim.claim_number?.slice(0, 8)}...</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900 text-sm">{claim.user?.name}</div>
                                        <div className="text-xs text-gray-400">{claim.user?.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-semibold text-gray-800">{claim.policy?.title || claim.claim_type}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="font-bold text-gray-900">₹{Number(claim.amount_claimed).toLocaleString('en-IN')}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[claim.status] || 'bg-gray-100 text-gray-600'}`}>
                                            {STATUS_ICONS[claim.status]} {claim.status?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-xs">
                                        {claim.incident_date}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate('/admin/claims', { state: { selectedClaimId: claim.id } }); }}
                                            className="text-xs px-4 py-2 bg-indigo-50 text-indigo-600 font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                        { label: 'Submitted Claims', status: 'submitted', icon: '📤', btn: 'bg-blue-600' },
                        { label: 'Under Review', status: 'under_review', icon: '🔍', btn: 'bg-yellow-500' },
                        { label: 'Approved Claims', status: 'approved', icon: '✅', btn: 'bg-green-600' },
                        { label: 'Rejected Claims', status: 'rejected', icon: '❌', btn: 'bg-red-500' },
                        { label: 'Fraud Alerts', status: null, icon: '🚨', btn: 'bg-rose-600' },
                    ].map(q => (
                        <button
                            key={q.label}
                            onClick={() => navigate('/admin/claims', { state: { filterStatus: q.status } })}
                            className={`${q.btn} text-white rounded-xl p-4 text-left hover:opacity-90 transition`}
                        >
                            <div className="text-2xl mb-1">{q.icon}</div>
                            <div className="text-xs font-bold">{q.label}</div>
                            <div className="text-lg font-bold mt-1">{q.status ? (stats?.counts?.[q.status] ?? 0) : fraudFlags.length}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Fraud Flags Panel */}
            {fraudFlags.length > 0 && (
                <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-red-100 bg-red-50 flex justify-between items-center">
                        <div>
                            <h2 className="font-bold text-red-800">🚨 Fraud Alerts ({fraudFlags.length})</h2>
                            <p className="text-xs text-red-600 mt-0.5">These claims have been automatically flagged by the fraud detection engine.</p>
                        </div>
                        <button onClick={() => navigate('/admin/claims')} className="text-sm text-red-600 font-bold hover:underline">Review All →</button>
                    </div>
                    <div className="divide-y divide-red-50">
                        {fraudFlags.map(flag => (
                            <div key={flag.id} className="px-6 py-3 flex items-start gap-4 hover:bg-red-50 transition">
                                <span className={`mt-0.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                                    flag.severity === 'critical' ? 'bg-red-600 text-white' :
                                    flag.severity === 'high' ? 'bg-red-100 text-red-700' :
                                    flag.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-gray-100 text-gray-600'
                                }`}>{flag.severity}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs text-gray-500">{flag.rule_code}</span>
                                        <span className="text-gray-300">·</span>
                                        <span className="text-xs font-medium text-gray-700">{flag.user_name}</span>
                                        <span className="text-gray-300">·</span>
                                        <span className="text-xs text-gray-400 font-mono">{flag.claim_number?.slice(0, 14)}...</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{flag.details}</p>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 font-bold ${
                                    flag.is_reviewed ? 'bg-gray-100 text-gray-500' : 'bg-red-100 text-red-700'
                                }`}>{flag.is_reviewed ? 'reviewed' : 'active'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
