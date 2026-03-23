
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';

const PolicyDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseSuccess, setPurchaseSuccess] = useState(false);

    useEffect(() => {
        const fetchPolicy = async () => {
            try {
                const response = await client.get(`/policies/${id}`);
                setPolicy(response.data);
            } catch (err) {
                setError('Failed to load policy details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPolicy();
    }, [id]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!policy) return <div>Policy not found</div>;

    const handleBuy = async () => {
        setPurchasing(true);
        setError('');
        try {
            await client.post('/user-policies/buy', { policy_id: parseInt(id) });
            setPurchaseSuccess(true);
            setTimeout(() => {
                navigate('/policies/my');
            }, 1000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to purchase policy.');
            setPurchasing(false);
        }
    };

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{policy.title}</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">{policy.provider?.name}</p>
                </div>
                <div className="flex gap-4 items-center">
                    {purchaseSuccess ? (
                        <span className="text-green-600 font-bold text-sm bg-green-50 px-3 py-1.5 rounded-md">✓ Purchased Successfully!</span>
                    ) : (
                        <button
                            onClick={handleBuy}
                            disabled={purchasing}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow transition disabled:opacity-50"
                        >
                            {purchasing ? 'Processing...' : 'Buy This Policy'}
                        </button>
                    )}
                    <button
                        onClick={() => navigate(-1)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium border border-indigo-200 hover:bg-indigo-50 px-3 py-2 rounded-md transition"
                    >
                        &larr; Back
                    </button>
                </div>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Policy Type</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 uppercase">{policy.policy_type}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Premium</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">₹{policy.premium} / {policy.term_months} months</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Deductible</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">₹{policy.deductible}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Coverage Details</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                                {Object.entries(policy.coverage || {}).map(([key, value]) => (
                                    <li key={key} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                                        <span className="w-0 flex-1 flex items-center">
                                            <span className="ml-2 flex-1 w-0 truncate capitalize">{key.replace('_', ' ')}</span>
                                        </span>
                                        <span className="ml-4 flex-shrink-0 font-medium">
                                            {value.toString()}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Terms & Conditions</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <a href={policy.tnc_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                                View Terms document
                            </a>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
};

export default PolicyDetails;
