
import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { Link } from 'react-router-dom';

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    const fetchRecommendations = async () => {
        try {
            const response = await client.get('/recommendations/');
            setRecommendations(response.data);
        } catch (err) {
            console.error("Failed to fetch recommendations", err);
            setError('Failed to load recommendations.');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            const response = await client.post('/recommendations/generate');
            setRecommendations(response.data);
        } catch (err) {
            console.error("Failed to generate recommendations", err);
            setError('Failed to generate new recommendations.');
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const getScoreColor = (score) => {
        if (score >= 80) return 'text-green-600 bg-green-50 ring-green-500/20';
        if (score >= 50) return 'text-yellow-600 bg-yellow-50 ring-yellow-500/20';
        return 'text-red-600 bg-red-50 ring-red-500/20';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Personalized Recommendations</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Based on your profile, we've analyzed strict criteria to find the best policies for you.
                    </p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${generating ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'
                        }`}
                >
                    {generating ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : (
                        'Generate New Analysis'
                    )}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            ) : recommendations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No recommendations yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Click "Generate New Analysis" to get started.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {recommendations.map((rec) => (
                        <div key={rec.id} className="group relative bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col">
                            {/* Score Badge */}
                            <div className="absolute top-4 right-4">
                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getScoreColor(rec.score)}`}>
                                    {rec.score}% Match
                                </span>
                            </div>

                            <div className="p-6 flex-1">
                                <p className="text-sm font-medium text-indigo-600 mb-1">
                                    {rec.policy?.policy_type?.toUpperCase() || 'INSURANCE'}
                                </p>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                                    {rec.policy?.title || 'Unknown Policy'}
                                </h3>

                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-sm text-gray-500">Premium</span>
                                        <span className="text-lg font-bold text-gray-900">₹{rec.policy?.premium?.toLocaleString() || 0}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-sm text-gray-500">Coverage</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            ₹{rec.policy?.coverage?.amount?.toLocaleString() || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* AI Reasoning Section */}
                                <div className="mt-6 bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                        Why we recommend this
                                    </p>
                                    <p className="text-sm text-gray-700 italic">
                                        "{rec.reason}"
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                                <Link
                                    to={`/policies/${rec.policy_id}`}
                                    className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 border-indigo-200 transition-colors"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Recommendations;
