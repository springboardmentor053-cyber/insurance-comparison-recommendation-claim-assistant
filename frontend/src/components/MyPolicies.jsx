
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const statusColor = {
    active: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-600',
};

const MyPolicies = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.get('/user-policies/my')
            .then(r => setPolicies(r.data))
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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Policies</h1>
                    <p className="text-gray-500 text-sm mt-1">Policies you have purchased.</p>
                </div>
                <button
                    onClick={() => navigate('/compare')}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition"
                >
                    Browse Policies
                </button>
            </div>

            {policies.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                    <div className="text-5xl mb-4">📋</div>
                    <h3 className="text-lg font-bold text-gray-700">No Policies Purchased Yet</h3>
                    <p className="text-gray-400 text-sm mt-2 mb-6">Browse policies and click "Buy This Policy" to get started.</p>
                    <button onClick={() => navigate('/compare')}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition">
                        Browse Policies
                    </button>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-5">
                    {policies.map(up => (
                        <div key={up.id} className="bg-white rounded-2xl border border-gray-200 hover:shadow-md transition overflow-hidden">
                            {/* Header */}
                            <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        {up.policy?.policy_type}
                                    </span>
                                    <p className="text-xs text-gray-400">{up.policy?.provider?.name}</p>
                                </div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${statusColor[up.status] || 'bg-gray-100 text-gray-500'}`}>
                                    {up.status}
                                </span>
                            </div>
                            {/* Body */}
                            <div className="p-5">
                                <h3 className="font-bold text-gray-900 text-base">{up.policy?.title}</h3>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                                    <div><span className="font-medium text-gray-700">Purchased:</span> {up.purchase_date}</div>
                                    <div><span className="font-medium text-gray-700">Expires:</span> {up.expiry_date}</div>
                                    <div><span className="font-medium text-gray-700">Premium:</span> ₹{up.premium_paid}/mo</div>
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="px-5 pb-4 grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => navigate(`/policies/${up.policy?.id}`)}
                                    className="py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
                                >
                                    View Details
                                </button>
                                {up.status === 'active' && (
                                    <button
                                        onClick={() => navigate('/claims/file', {
                                            state: {
                                                user_policy_id: up.id,
                                                policy_type: up.policy?.policy_type,
                                                policy_title: up.policy?.title,
                                                coverage_limit: up.policy?.coverage?.limit,
                                            }
                                        })}
                                        className="py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-lg transition"
                                    >
                                        File a Claim
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyPolicies;
