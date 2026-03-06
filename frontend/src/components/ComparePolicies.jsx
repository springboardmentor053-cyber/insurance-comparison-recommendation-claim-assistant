
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';

const ComparePolicies = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // State for all available policies (fetched from API)
    const [allPolicies, setAllPolicies] = useState([]);
    // State for selected policies to compare
    const [selectedPolicies, setSelectedPolicies] = useState(location.state?.policies || []);
    // Score map passed from Dashboard: { policy_id: score }
    const scoreMap = location.state?.scoreMap || {};
    // Default to 'health' or the type of the first passed policy, or 'all' if none
    const initialType = location.state?.policies?.[0]?.policy_type || 'health';
    const [selectedType, setSelectedType] = useState(initialType.toLowerCase());

    // View mode: 'selection' (list to choose) or 'comparison' (side-by-side)
    // If policies were passed via state (from dashboard), default to 'comparison', else 'selection'
    const [viewMode, setViewMode] = useState(location.state?.policies ? 'comparison' : 'selection');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPolicies = async () => {
            try {
                const response = await client.get('/policies/');
                setAllPolicies(response.data);
            } catch (error) {
                console.error("Error fetching policies:", error);
            } finally {
                setLoading(false);
            }
        };

        // If we are in selection mode or need to load data, fetch
        fetchPolicies();
    }, []);


    // Filter policies by selected type
    const filteredPolicies = allPolicies.filter(p => selectedType === 'all' || p.policy_type.toLowerCase() === selectedType.toLowerCase());

    const toggleSelection = (policy) => {
        if (selectedPolicies.find(p => p.id === policy.id)) {
            setSelectedPolicies(selectedPolicies.filter(p => p.id !== policy.id));
        } else {
            if (selectedPolicies.length >= 3) {
                alert("You can compare up to 3 policies at a time.");
                return;
            }
            // Enforce same type
            if (selectedPolicies.length > 0 && selectedPolicies[0].policy_type !== policy.policy_type) {
                alert(`Please select only ${selectedPolicies[0].policy_type} policies to compare.`);
                return;
            }
            setSelectedPolicies([...selectedPolicies, policy]);
        }
    };

    const handleTypeChange = (type) => {
        setSelectedType(type);
    };

    /**
     * Best Policy Detection:
     * 1. If coming from Dashboard with scoreMap → use AI recommendation score (highest score = best match)
     * 2. Fallback: use coverage features per premium ratio
     */
    const bestPolicyId = React.useMemo(() => {
        if (!selectedPolicies.length) return null;

        // Priority: use recommendation scores if available from Dashboard
        const hasScores = selectedPolicies.some(p => scoreMap[p.id] != null);
        if (hasScores) {
            let bestId = null;
            let maxScore = -1;
            selectedPolicies.forEach(p => {
                const s = scoreMap[p.id] ?? 0;
                if (s > maxScore) { maxScore = s; bestId = p.id; }
            });
            return bestId;
        }

        // Fallback heuristic: coverage features per dollar premium
        let bestId = null;
        let maxScore = -1;
        selectedPolicies.forEach(p => {
            let featureCount = 0;
            if (p.coverage) {
                Object.values(p.coverage).forEach(v => {
                    if (v === true || (typeof v === 'number' && v > 0)) featureCount++;
                });
            }
            const premium = parseFloat(p.premium) || 1;
            const score = featureCount / premium;
            if (score > maxScore) { maxScore = score; bestId = p.id; }
        });
        return bestId;
    }, [selectedPolicies, scoreMap]);

    if (loading) return <div className="p-12 text-center text-gray-500">Loading policies...</div>;

    // VIEW: SELECTION MODE (List of all policies)
    if (viewMode === 'selection') {
        return (
            <div className="space-y-8 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Compare Insurance Plans</h2>
                        <p className="text-gray-500 mt-1">Select a category and choose up to 3 plans.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Type Selector */}
                        <div className="relative">
                            <select
                                value={selectedType}
                                onChange={(e) => handleTypeChange(e.target.value)}
                                className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium capitalize"
                            >
                                <option value="all">All Categories</option>
                                <option value="health">Health Insurance</option>
                                <option value="life">Life Insurance</option>
                                <option value="auto">Auto Insurance</option>
                                <option value="home">Home Insurance</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                            </div>
                        </div>

                        <button
                            onClick={() => setViewMode('comparison')}
                            disabled={selectedPolicies.length < 2}
                            className={`px-6 py-2 rounded-lg font-bold shadow-sm transition-all ${selectedPolicies.length < 2
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md transform hover:-translate-y-0.5'
                                }`}
                        >
                            Compare ({selectedPolicies.length})
                        </button>
                    </div>
                </div>

                {filteredPolicies.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                        No policies found in this category.
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPolicies.map(policy => {
                            const isSelected = selectedPolicies.find(p => p.id === policy.id);
                            return (
                                <div
                                    key={policy.id}
                                    className={`relative bg-white rounded-2xl transition-all duration-300 flex flex-col overflow-hidden ${isSelected
                                        ? 'border-2 border-indigo-600 shadow-xl ring-2 ring-indigo-50 transform -translate-y-1'
                                        : 'border border-gray-200 hover:shadow-lg hover:border-indigo-200'
                                        }`}
                                >
                                    {/* Card Header */}
                                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                                {policy.provider?.name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-semibold text-gray-600">{policy.provider?.name}</span>
                                        </div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-white px-2 py-1 rounded border border-indigo-100">
                                            {policy.policy_type}
                                        </span>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">
                                            {policy.title}
                                        </h3>

                                        <div className="mt-auto pt-4">
                                            <div className="flex items-baseline mb-1">
                                                <span className="text-3xl font-bold text-gray-900">${policy.premium}</span>
                                                <span className="text-sm text-gray-500 ml-1">/mo</span>
                                            </div>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <span>Term: <span className="font-medium text-gray-900">{policy.term_months} mo</span></span>
                                                <span className="mx-2">•</span>
                                                <span>Limit: <span className="font-medium text-gray-900">${parseInt(policy.coverage?.limit || policy.coverage?.sum_insured || 250000).toLocaleString()}</span></span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer - Actions */}
                                    <div className="p-4 border-t border-gray-100 bg-white grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => toggleSelection(policy)}
                                            className={`flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSelected
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Selected
                                                </>
                                            ) : 'Select'}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/policies/${policy.id}`);
                                            }}
                                            className="flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors"
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
        );
    }

    // VIEW: COMPARISON MODE (Side-by-side table)
    return (
        <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (location.state?.fromDashboard) {
                                navigate('/');
                            } else {
                                setViewMode('selection');
                            }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-indigo-600"
                        title={location.state?.fromDashboard ? "Back to Dashboard" : "Back to Selection"}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Comparison</h2>
                        <p className="text-sm text-gray-500 capitalize">{selectedType} Insurance Plans</p>
                    </div>
                </div>
                {/* Could add Export/Print buttons here */}
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto pb-4">
                <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0 rounded-xl shadow-sm border border-gray-200 bg-white overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider w-1/4 border-b border-gray-200">Features</th>
                            {selectedPolicies.map(p => (
                                <th key={p.id} scope="col" className={`px-6 py-5 text-center relative border-b border-gray-200 ${bestPolicyId === p.id ? 'bg-indigo-50/70' : ''}`}>
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <div className={`text-base font-bold ${bestPolicyId === p.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                                            {p.title}
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            {bestPolicyId === p.id && (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-sm">
                                                    ⭐ Best Match for You
                                                </span>
                                            )}
                                            {scoreMap[p.id] != null && (
                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${bestPolicyId === p.id
                                                        ? 'text-indigo-600 bg-indigo-100'
                                                        : 'text-gray-500 bg-gray-100'
                                                    }`}>
                                                    {scoreMap[p.id]}% match
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        <tr className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-b border-gray-100">Provider</td>
                            {selectedPolicies.map(p => (
                                <td key={p.id} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 border-b border-gray-100">{p.provider?.name || 'N/A'}</td>
                            ))}
                        </tr>
                        <tr className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-b border-gray-100">Monthly Premium</td>
                            {selectedPolicies.map(p => (
                                <td key={p.id} className="px-6 py-4 whitespace-nowrap text-lg text-center font-bold text-gray-900 border-b border-gray-100">${p.premium}</td>
                            ))}
                        </tr>
                        {/* ... more rows ... (Keeping simple for readability, could expand) */}
                        <tr className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-b border-gray-100">Deductible</td>
                            {selectedPolicies.map(p => (
                                <td key={p.id} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 border-b border-gray-100">${p.deductible}</td>
                            ))}
                        </tr>
                        <tr className="group hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 border-b border-gray-100">Coverage Term</td>
                            {selectedPolicies.map(p => (
                                <td key={p.id} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600 border-b border-gray-100">{p.term_months} Months</td>
                            ))}
                        </tr>

                        {/* Dynamic Coverage Rows */}
                        {Array.from(new Set(selectedPolicies.flatMap(p => Object.keys(p.coverage || {})))).map(key => (
                            <tr key={key} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 border-b border-gray-100 capitalize pl-8 relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                                    {key.replace(/_/g, ' ')}
                                </td>
                                {selectedPolicies.map(p => (
                                    <td key={p.id} className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 border-b border-gray-100">
                                        {typeof p.coverage?.[key] === 'boolean'
                                            ? (p.coverage[key]
                                                ? <span className="text-green-600 font-bold">Included</span>
                                                : <span className="text-gray-300">Not Included</span>)
                                            : (p.coverage?.[key]?.toString() || '-')}
                                    </td>
                                ))}
                            </tr>
                        ))}

                        <tr>
                            <td className="px-6 py-6 whitespace-nowrap border-t border-gray-200 bg-gray-50"></td>
                            {selectedPolicies.map(p => (
                                <td key={p.id} className="px-6 py-6 whitespace-nowrap text-center border-t border-gray-200 bg-gray-50">
                                    <button
                                        onClick={() => navigate(`/policies/${p.id}`)}
                                        className={`w-full py-3 px-4 rounded-xl text-sm font-bold shadow-sm transition-all transform hover:-translate-y-0.5 ${bestPolicyId === p.id
                                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 ring-4 ring-indigo-200'
                                            : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                                            }`}
                                    >
                                        View Details
                                    </button>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ComparePolicies;
