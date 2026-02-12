
import React, { useState, useEffect } from 'react';
import client from '../api/client';
import PolicyCard from './PolicyCard';
import { useNavigate } from 'react-router-dom';

const PolicyList = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('');
    const [selectedPolicies, setSelectedPolicies] = useState([]);

    useEffect(() => {
        fetchPolicies();
    }, [filter]);

    const fetchPolicies = async () => {
        setLoading(true);
        try {
            const params = filter ? { policy_type: filter } : {};
            console.log("Fetching policies with params:", params);
            const response = await client.get('/policies/', { params });
            console.log("Policies response:", response);
            setPolicies(response.data);
        } catch (err) {
            console.error("Error fetching policies:", err);
            console.error("Error details:", err.response); // Log full error response
            setError('Failed to load policies. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPolicy = (policy) => {
        setSelectedPolicies(prev => {
            // Check if already selected
            if (prev.find(p => p.id === policy.id)) {
                return prev.filter(p => p.id !== policy.id);
            }

            // Check if type matches existing selection
            if (prev.length > 0 && prev[0].policy_type !== policy.policy_type) {
                alert(`You can only compare policies of the same type. Current selection: ${prev[0].policy_type.toUpperCase()}`);
                return prev;
            }

            // Limit to 3
            if (prev.length >= 3) {
                alert("You can compare up to 3 policies");
                return prev;
            }
            return [...prev, policy];
        });
    };

    const handleCompareClick = () => {
        if (selectedPolicies.length < 2) {
            alert("Please select at least 2 policies to compare.");
            return;
        }
        navigate('/compare', { state: { policies: selectedPolicies } });
    };

    if (loading && policies.length === 0) return <div className="text-center py-10">Loading policies...</div>;

    return (
        <div>
            <div className="mb-6 flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-200 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-sm text-gray-500">Your personalized insurance recommendations</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Compare Button in Header */}
                    <button
                        onClick={handleCompareClick}
                        disabled={selectedPolicies.length < 2}
                        className={`inline-flex justify-center items-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 w-full sm:w-auto ${selectedPolicies.length >= 2
                            ? 'bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Compare ({selectedPolicies.length})
                    </button>

                    <select
                        value={filter}
                        onChange={(e) => {
                            setFilter(e.target.value);
                            setSelectedPolicies([]); // Reset selection on filter change
                        }}
                        className="block w-full sm:w-48 rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                    >
                        <option value="">All Types</option>
                        <option value="health">Health</option>
                        <option value="auto">Auto</option>
                        <option value="home">Home</option>
                        <option value="life">Life</option>
                        <option value="travel">Travel</option>
                    </select>
                </div>
            </div>

            {error && <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map(policy => (
                    <PolicyCard
                        key={policy.id}
                        policy={policy}
                        selected={!!selectedPolicies.find(p => p.id === policy.id)}
                        onSelect={handleSelectPolicy}
                    />
                ))}
            </div>


        </div>
    );
};

export default PolicyList;
