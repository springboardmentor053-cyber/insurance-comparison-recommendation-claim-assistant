import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

const PROFILE_COMPLETENESS_FIELDS = [
    'annual_income', 'marital_status', 'employment_type',
    'family_size', 'risk_appetite', 'coverage_priority'
];

const getProfileCompleteness = (risk_profile) => {
    if (!risk_profile) return 0;
    const filled = PROFILE_COMPLETENESS_FIELDS.filter(f => risk_profile[f] != null && risk_profile[f] !== '');
    return Math.round((filled.length / PROFILE_COMPLETENESS_FIELDS.length) * 100);
};

const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-700 bg-green-50 ring-green-400/30';
    if (score >= 60) return 'text-yellow-700 bg-yellow-50 ring-yellow-400/30';
    return 'text-blue-700 bg-blue-50 ring-blue-400/30';
};

const getScoreLabel = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 55) return 'Suitable';
    return 'Possible';
};

// Renders reason text as bullet points split by ";"
const ReasonText = ({ reason }) => {
    const bullets = reason
        ? reason.split(';').map(s => s.trim()).filter(Boolean)
        : [];
    return (
        <ul className="mt-2 space-y-1.5">
            {bullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-indigo-700">
                    <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                    <span>{bullet}</span>
                </li>
            ))}
        </ul>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecs, setSelectedRecs] = useState([]);
    const [expandedReason, setExpandedReason] = useState(null);

    const profileCompleteness = getProfileCompleteness(user?.risk_profile);
    const isProfileIncomplete = profileCompleteness < 60;

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const response = await client.get('/recommendations/');
            setRecommendations(response.data);
        } catch (error) {
            console.error("Error loading recommendations:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (user) fetchRecommendations();
    }, [user]);

    const toggleSelection = (recId) => {
        if (selectedRecs.includes(recId)) {
            setSelectedRecs(selectedRecs.filter(id => id !== recId));
        } else {
            if (selectedRecs.length >= 3) {
                alert("You can compare up to 3 policies.");
                return;
            }
            setSelectedRecs([...selectedRecs, recId]);
        }
    };

    const handleCompare = () => {
        if (selectedRecs.length < 2) return;
        const selectedRecommendations = recommendations.filter(r => selectedRecs.includes(r.id));
        const policiesToCompare = selectedRecommendations.map(r => r.policy);
        // Pass real AI scores to Compare page for Best Match detection
        const scoreMap = {};
        selectedRecommendations.forEach(r => {
            scoreMap[r.policy.id] = Math.round(Number(r.score));
        });
        navigate('/compare', {
            state: { policies: policiesToCompare, scoreMap, fromDashboard: true }
        });
    };

    return (
        <div className="space-y-6 animate-fadeIn">

            {/* Onboarding Banner — shown when profile < 60% */}
            {isProfileIncomplete && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                            <div className="h-12 w-12 flex-shrink-0 bg-white/20 rounded-full flex items-center justify-center text-2xl">🎯</div>
                            <div>
                                <h3 className="text-lg font-bold">Complete Your Risk Profile</h3>
                                <p className="text-indigo-100 text-sm mt-1">
                                    Your profile is <strong>{profileCompleteness}% complete</strong>. More details = better recommendations.
                                </p>
                                <div className="mt-2 w-48 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${profileCompleteness}%` }} />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/profile')}
                            className="flex-shrink-0 px-6 py-2.5 bg-white text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow"
                        >
                            Complete Profile →
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h1>
                    <p className="mt-1 text-gray-500 text-sm">
                        {recommendations.length > 0
                            ? `${recommendations.length} policies matched to your risk profile.`
                            : 'Complete your risk profile to get personalized recommendations.'}
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={handleCompare}
                        disabled={selectedRecs.length < 2}
                        className={`px-4 py-2 rounded-lg font-bold shadow-sm transition-all flex items-center gap-2 ${selectedRecs.length < 2
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Compare ({selectedRecs.length})
                    </button>
                    <button
                        onClick={() => navigate('/compare')}
                        className="px-4 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
                    >
                        View All Policies
                    </button>
                </div>
            </div>

            {/* Recommendations Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Your Personalized Recommendations
                    </h2>
                    <span className="text-sm text-gray-400">Select 2–3 to compare</span>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                        <p className="text-gray-400 text-sm">Analyzing your profile...</p>
                    </div>
                ) : recommendations.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="text-lg font-bold text-gray-700">No Recommendations Yet</h3>
                        <p className="text-gray-400 text-sm mt-2 mb-6 max-w-sm mx-auto">
                            Fill in your Risk Profile so we can match you with the right policies.
                        </p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition"
                        >
                            Set Up Risk Profile
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recommendations.map((rec) => {
                            const isSelected = selectedRecs.includes(rec.id);
                            const score = Math.round(Number(rec.score));
                            const isExpanded = expandedReason === rec.id;

                            return (
                                <div
                                    key={rec.id}
                                    className={`relative bg-white border rounded-2xl transition-all duration-300 flex flex-col overflow-hidden ${isSelected
                                            ? 'border-indigo-600 ring-2 ring-indigo-100 shadow-lg -translate-y-1'
                                            : 'border-gray-200 hover:border-indigo-200 hover:shadow-md'
                                        }`}
                                >
                                    {/* Top Bar */}
                                    <div className="px-5 pt-4 pb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelection(rec.id)}
                                                className="h-4 w-4 text-indigo-600 rounded border-gray-300 cursor-pointer"
                                            />
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                                {rec.policy?.policy_type}
                                            </span>
                                        </div>
                                        <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${getScoreColor(score)}`}>
                                            <span>{getScoreLabel(score)}</span>
                                            <span className="opacity-40">·</span>
                                            <span>{score}%</span>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="px-5 pb-3 flex-1">
                                        <h3 className="text-base font-bold text-gray-900 leading-tight">
                                            {rec.policy?.title}
                                        </h3>
                                        <p className="text-xs text-gray-400 mt-0.5">{rec.policy?.provider?.name}</p>

                                        {/* WHY THIS SUITS YOU — expandable */}
                                        <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                                                    Why this suits you
                                                </span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedReason(isExpanded ? null : rec.id);
                                                    }}
                                                    className="text-[10px] text-indigo-400 hover:text-indigo-600 font-semibold transition-colors"
                                                >
                                                    {isExpanded ? 'Show less ▲' : 'Show all ▼'}
                                                </button>
                                            </div>
                                            {isExpanded ? (
                                                <ReasonText reason={rec.reason} />
                                            ) : (
                                                <p className="text-xs text-indigo-700 leading-relaxed">
                                                    {rec.reason?.split(';')[0]?.trim()}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-baseline">
                                            <span className="text-2xl font-bold text-gray-900">₹{rec.policy?.premium}</span>
                                            <span className="text-gray-400 text-sm ml-1">/mo</span>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="px-5 pb-4 grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleSelection(rec.id); }}
                                            className={`py-2 text-sm font-medium rounded-lg transition-colors ${isSelected
                                                    ? 'bg-indigo-100 text-indigo-700'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {isSelected ? '✓ Selected' : 'Select'}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); navigate(`/policies/${rec.policy.id}`); }}
                                            className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                                        >
                                            View Details
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
