
import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';

const ComparePolicies = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // policies to compare passed via state
    const { policies = [] } = location.state || {}; // Fallback to empty

    console.log("ComparePolicies Rendered. Policies:", policies);

    try {
        if (!policies || !Array.isArray(policies)) {
            console.error("Invalid policies data:", policies);
            return <div className="p-4 text-red-600">Error: Invalid policy data selected.</div>;
        }
    } catch (e) {
        console.error("Error in ComparePolicies sanity check", e);
    }

    // Calculate Best Value (Simple heuristic: most coverage items per dollar)
    const bestPolicyId = React.useMemo(() => {
        if (!policies.length) return null;

        let bestId = null;
        let maxScore = -1;

        policies.forEach(p => {
            // Count number of 'true' boolean coverages or non-null values
            let coverageCount = 0;
            if (p.coverage) {
                Object.values(p.coverage).forEach(v => {
                    if (v === true || (v !== false && v !== null && v !== undefined)) coverageCount++;
                });
            }

            // Avoid division by zero
            const premium = parseFloat(p.premium) || 1;
            const score = coverageCount / premium;

            if (score > maxScore) {
                maxScore = score;
                bestId = p.id;
            }
        });

        return bestId;
    }, [policies]);


    if (policies.length === 0) {
        return (
            <div className="text-center py-10">
                <h2 className="text-xl font-medium text-gray-900">No policies selected to compare</h2>
                <Link to="/policies" className="text-indigo-600 hover:text-indigo-500 mt-2 inline-block">
                    Browse Policies
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header with Back Button */}
            <div className="flex justify-between items-center">
                <div>
                    <button
                        onClick={() => navigate('/policies')}
                        className="flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors mb-1"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Policies
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Policy Comparison</h2>
                </div>
                {/* 
                <button
                    onClick={() => navigate('/policies')}
                    className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                    Add more policies
                </button> 
                */}
            </div>

            <div className="overflow-x-auto pb-4">
                <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0 rounded-lg shadow-sm border border-gray-200 bg-white">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4 border-b border-gray-200">Feature</th>
                            {policies.map(p => (
                                <th key={p.id} scope="col" className={`px-6 py-4 text-center relative border-b border-gray-200 ${bestPolicyId === p.id ? 'bg-indigo-50' : ''}`}>
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                        <div className={`text-sm font-bold ${bestPolicyId === p.id ? 'text-indigo-700' : 'text-gray-900'}`}>
                                            {p.title}
                                        </div>

                                        {bestPolicyId === p.id && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-sm">
                                                ★ Best Value
                                            </span>
                                        )}
                                    </div>

                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-100">Provider</td>
                            {policies.map(p => (
                                <td key={p.id} className={`px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 border-b border-gray-100 ${bestPolicyId === p.id ? 'bg-indigo-50/30' : ''}`}>{p.provider?.name || 'N/A'}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-100">Policy Type</td>
                            {policies.map(p => (
                                <td key={p.id} className={`px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 uppercase border-b border-gray-100 ${bestPolicyId === p.id ? 'bg-indigo-50/30' : ''}`}>{p.policy_type}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-100">Premium</td>
                            {policies.map(p => (
                                <td key={p.id} className={`px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900 border-b border-gray-100 ${bestPolicyId === p.id ? 'bg-indigo-50/30 text-indigo-700' : ''}`}>${p.premium}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-100">Deductible</td>
                            {policies.map(p => (
                                <td key={p.id} className={`px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 border-b border-gray-100 ${bestPolicyId === p.id ? 'bg-indigo-50/30' : ''}`}>${p.deductible}</td>
                            ))}
                        </tr>
                        <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-gray-100">Term</td>
                            {policies.map(p => (
                                <td key={p.id} className={`px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 border-b border-gray-100 ${bestPolicyId === p.id ? 'bg-indigo-50/30' : ''}`}>{p.term_months} Months</td>
                            ))}
                        </tr>

                        {/* Coverage Header */}
                        <tr>
                            <td className="px-6 py-3 whitespace-nowrap text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200" colSpan={policies.length + 1}>
                                Coverage Details
                            </td>
                        </tr>

                        {/* Dynamic Coverage Rows */}
                        {Array.from(new Set(policies.flatMap(p => Object.keys(p.coverage || {})))).map(key => {
                            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            return (
                                <tr key={key} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700 border-b border-gray-100 group-last:border-0">{label}</td>
                                    {policies.map(p => {
                                        const val = p.coverage?.[key];
                                        let displayVal = '-';
                                        if (typeof val === 'boolean') {
                                            displayVal = val ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Included
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                    Not Included
                                                </span>
                                            );
                                        } else if (val !== undefined && val !== null) {
                                            if (typeof val === 'object') {
                                                displayVal = JSON.stringify(val); // Safety for nested objects
                                            } else {
                                                displayVal = val.toString();
                                                // Simple heuristic for currency
                                                if (!isNaN(val) && (key.includes('limit') || key.includes('sum') || key.includes('cover') || key.includes('hospital'))) {
                                                    displayVal = `$${val.toLocaleString()}`;
                                                }
                                            }
                                        }

                                        return (
                                            <td key={p.id} className={`px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 border-b border-gray-100 group-last:border-0 ${bestPolicyId === p.id ? 'bg-indigo-50/30' : ''}`}>
                                                {displayVal}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}

                        <tr>
                            <td className="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50 border-t border-gray-200"></td>
                            {policies.map(p => (
                                <td key={p.id} className={`px-6 py-6 whitespace-nowrap text-center bg-gray-50 border-t border-gray-200 ${bestPolicyId === p.id ? 'bg-indigo-50/50' : ''}`}>
                                    <button
                                        onClick={() => navigate(`/policies/${p.id}`)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-all transform hover:-translate-y-0.5 ${bestPolicyId === p.id
                                            ? 'text-white bg-indigo-600 hover:bg-indigo-700 ring-2 ring-indigo-300 ring-offset-2'
                                            : 'text-indigo-700 bg-white border border-indigo-200 hover:bg-indigo-50'
                                            }`}
                                    >
                                        {bestPolicyId === p.id ? 'Choose Best Value' : 'View Details'}
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
