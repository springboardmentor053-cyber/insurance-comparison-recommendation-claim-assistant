
import React from 'react';
import { Link } from 'react-router-dom';

const PolicyCard = ({ policy, onSelect, selected }) => {
    return (
        <div className={`bg-white rounded-lg shadow-md p-6 border-2 transition-all relative ${selected ? 'border-indigo-600 ring-1 ring-indigo-600' : 'border-transparent hover:border-gray-200'}`}>

            {/* Selection Checkbox for Comparison */}
            <div className="absolute top-4 right-4">
                <label className="inline-flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onSelect(policy)}
                        className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300 transition duration-150 ease-in-out"
                    />
                    <span className="text-xs font-medium text-gray-500">Compare</span>
                </label>
            </div>

            <div className="flex justify-between items-start mb-4 pr-10"> {/* Added pr-10 to avoid overlap with checkbox */}
                <div>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${policy.policy_type === 'health' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                        policy.policy_type === 'auto' ? 'bg-blue-50 text-blue-700 ring-blue-600/20' :
                            'bg-yellow-50 text-yellow-700 ring-yellow-600/20'
                        }`}>
                        {policy.policy_type.toUpperCase()}
                    </span>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900">{policy.title}</h3>
                    <p className="text-sm text-gray-500">{policy.provider?.name || 'Provider'}</p>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex items-baseline">
                    <p className="text-2xl font-bold text-gray-900">${policy.premium}</p>
                    <p className="text-xs text-gray-500 ml-1">/{policy.term_months}mo</p>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Deductible:</span>
                    <span className="font-medium">${policy.deductible}</span>
                </div>
                <div className="text-sm">
                    <span className="text-gray-500">Coverage:</span>
                    <ul className="list-disc list-inside mt-1 text-gray-600 text-xs truncate">
                        {Object.entries(policy.coverage || {}).slice(0, 2).map(([key, value]) => (
                            <li key={key}>{key}: {value.toString()}</li>
                        ))}
                    </ul>
                </div>
            </div>

            <Link
                to={`/policies/${policy.id}`}
                className="block w-full text-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
                View Plan
            </Link>
        </div>
    );
};

export default PolicyCard;
