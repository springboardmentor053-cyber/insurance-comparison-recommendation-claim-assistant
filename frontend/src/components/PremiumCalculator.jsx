
import React, { useState } from 'react';

const PremiumCalculator = () => {
    const [input, setInput] = useState({
        age: '',
        policyType: 'health',
        coverageAmount: '',
        duration: '12'
    });
    const [result, setResult] = useState(null);

    const calculatePremium = (e) => {
        e.preventDefault();
        // Simple client-side logic for demonstration (Week 1/2)
        // Base rate
        let baseRate = 100;

        // Type multiplier
        if (input.policyType === 'health') baseRate *= 1.5;
        if (input.policyType === 'auto') baseRate *= 1.2;
        if (input.policyType === 'life') baseRate *= 2.0;

        // Age multiplier
        const age = parseInt(input.age);
        if (age > 50) baseRate *= 1.5;
        else if (age > 30) baseRate *= 1.2;

        // Coverage multiplier
        const coverage = parseInt(input.coverageAmount);
        baseRate += (coverage / 1000) * 2;

        // Duration
        const months = parseInt(input.duration);
        const totalPremium = baseRate * (months / 12);

        setResult(totalPremium.toFixed(2));
    };

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Premium Calculator</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Estimate your insurance costs instantly.</p>
            </div>
            <div className="px-4 py-5 sm:p-6">
                <form onSubmit={calculatePremium} className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                            <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
                            <div className="mt-1">
                                <input
                                    type="number"
                                    name="age"
                                    id="age"
                                    required
                                    value={input.age}
                                    onChange={e => setInput({ ...input, age: e.target.value })}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="policyType" className="block text-sm font-medium text-gray-700">Policy Type</label>
                            <div className="mt-1">
                                <select
                                    id="policyType"
                                    name="policyType"
                                    value={input.policyType}
                                    onChange={e => setInput({ ...input, policyType: e.target.value })}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                >
                                    <option value="health">Health</option>
                                    <option value="auto">Auto</option>
                                    <option value="life">Life</option>
                                    <option value="home">Home</option>
                                </select>
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="coverageAmount" className="block text-sm font-medium text-gray-700">Coverage Amount ($)</label>
                            <div className="mt-1">
                                <input
                                    type="number"
                                    name="coverageAmount"
                                    id="coverageAmount"
                                    required
                                    value={input.coverageAmount}
                                    onChange={e => setInput({ ...input, coverageAmount: e.target.value })}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">Duration (Months)</label>
                            <div className="mt-1">
                                <select
                                    id="duration"
                                    name="duration"
                                    value={input.duration}
                                    onChange={e => setInput({ ...input, duration: e.target.value })}
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                >
                                    <option value="6">6 Months</option>
                                    <option value="12">12 Months</option>
                                    <option value="24">24 Months</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Calculate
                        </button>
                    </div>
                </form>

                {result && (
                    <div className="mt-6 bg-gray-50 p-4 rounded-md border border-gray-200">
                        <h4 className="text-md font-medium text-gray-900">Estimated Premium</h4>
                        <p className="text-3xl font-bold text-indigo-600 mt-2">${result}</p>
                        <p className="text-sm text-gray-500">This is an estimate based on standard rates. Final premium may vary.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremiumCalculator;
