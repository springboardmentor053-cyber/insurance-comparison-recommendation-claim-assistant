import React, { useState, useEffect } from 'react';

const POLICY_TYPES = [
    { id: 'health', label: 'Health Insurance', icon: '🏥', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    { id: 'auto', label: 'Auto Insurance', icon: '🚗', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: 'life', label: 'Life Insurance', icon: '👨‍👩‍👧', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'home', label: 'Home Insurance', icon: '🏠', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
];

const PremiumCalculator = () => {
    const [input, setInput] = useState({
        age: 30,
        policyType: 'health',
        coverageAmount: 500000, // 5 Lakhs default
        duration: '12' // Months
    });

    const [breakdown, setBreakdown] = useState(null);

    // Auto calculate on input change
    useEffect(() => {
        calculatePremium();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input]);

    const calculatePremium = () => {
        // Base starting premium per year
        let baseRate = 2000; 

        // Type multiplier
        let policyFactor = 1.0;
        if (input.policyType === 'health') policyFactor = 1.5;
        if (input.policyType === 'auto') policyFactor = 1.2;
        if (input.policyType === 'life') policyFactor = 2.0;
        if (input.policyType === 'home') policyFactor = 0.8;

        // Age multiplier
        let ageFactor = 1.0;
        const age = parseInt(input.age);
        if (age > 60) ageFactor = 2.5;
        else if (age > 45) ageFactor = 1.8;
        else if (age > 30) ageFactor = 1.2;

        // Base * Factors
        const riskPremium = baseRate * policyFactor * ageFactor;

        // Coverage Cost (e.g. ₹500 per ₹1,000,000 of coverage)
        const coverage = parseInt(input.coverageAmount);
        const coveragePremium = (coverage / 100000) * 800; // 800 per Lakh

        const annualPremium = riskPremium + coveragePremium;
        
        // Duration specific calculation
        const months = parseInt(input.duration);
        const finalPremium = annualPremium * (months / 12);
        
        // Add a small 2% fee / tax logic for realism
        const tax = finalPremium * 0.18; // 18% GST

        setBreakdown({
            baseRate,
            riskPremium,
            coveragePremium,
            annualPremium,
            finalPremium,
            tax,
            total: finalPremium + tax
        });
    };

    const handleSliderChange = (e) => {
        const { name, value } = e.target;
        setInput(prev => ({ ...prev, [name]: parseInt(value) }));
    };

    const formatINR = (val) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val);

    const activePolicy = POLICY_TYPES.find(p => p.id === input.policyType);

    return (
        <div className="max-w-6xl mx-auto animate-fadeIn">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Premium Calculator</h2>
                <p className="mt-2 text-gray-500 max-w-2xl mx-auto">Get an instant estimate for your insurance premiums using our live dynamic calculator. Adjust the sliders below to see how factors affect your cost.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── LEFT COLUMN: INPUTS ── */}
                <div className="lg:col-span-7 space-y-8 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
                    
                    {/* Policy Type Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Select Insurance Type</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {POLICY_TYPES.map(policy => (
                                <button
                                    key={policy.id}
                                    type="button"
                                    onClick={() => setInput({ ...input, policyType: policy.id })}
                                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                                        input.policyType === policy.id
                                        ? `${policy.border} ${policy.bg} ${policy.color} shadow-sm ring-1 ring-${policy.border.split('-')[1]}-200`
                                        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="text-2xl mb-2">{policy.icon}</span>
                                    <span className="text-xs font-bold text-center">{policy.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6 space-y-8">
                        {/* Age Slider */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm font-semibold text-gray-700">Your Age</label>
                                <span className="text-lg font-bold text-indigo-600">{input.age} years</span>
                            </div>
                            <input
                                type="range"
                                name="age"
                                min="18"
                                max="80"
                                value={input.age}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                                <span>18 yrs</span>
                                <span>80 yrs</span>
                            </div>
                        </div>

                        {/* Coverage Amount Slider */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm font-semibold text-gray-700">Desired Coverage Amount</label>
                                <span className="text-xl font-bold text-indigo-600">₹{formatINR(input.coverageAmount)}</span>
                            </div>
                            <input
                                type="range"
                                name="coverageAmount"
                                min="100000"
                                max="10000000"
                                step="100000"
                                value={input.coverageAmount}
                                onChange={handleSliderChange}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                                <span>₹1 Lakh</span>
                                <span>₹1 Crore</span>
                            </div>
                        </div>

                        {/* Duration Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Policy Duration</label>
                            <div className="flex gap-4">
                                {[
                                    { value: '6', label: '6 Months' },
                                    { value: '12', label: '1 Year' },
                                    { value: '24', label: '2 Years' },
                                ].map(dur => (
                                    <label key={dur.value} className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition ${
                                        input.duration === dur.value 
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' 
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}>
                                        <input 
                                            type="radio" 
                                            name="duration" 
                                            value={dur.value} 
                                            checked={input.duration === dur.value} 
                                            onChange={(e) => setInput({...input, duration: e.target.value})}
                                            className="sr-only"
                                        />
                                        {dur.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT COLUMN: RESULTS ── */}
                {breakdown ? (
                    <div className="lg:col-span-5">
                        <div className="sticky top-8 bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col h-full lg:h-auto border border-gray-100">
                            {/* Result Header */}
                            <div className="p-8 pb-6 border-b border-gray-100 text-center relative overflow-hidden bg-indigo-50">
                                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${activePolicy?.bg} ${activePolicy?.border} mb-4 border text-3xl shadow-sm`}>
                                    {activePolicy?.icon}
                                </div>
                                <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-widest mb-2">Estimated {input.duration}M Premium</h3>
                                <div className="flex items-start justify-center text-gray-900">
                                    <span className="text-3xl font-medium mt-1 mr-1 text-gray-400">₹</span>
                                    <span className="text-6xl font-black tracking-tight text-gray-900">{formatINR(breakdown.total)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1 font-medium pb-2">
                                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Includes 18% GST (₹{formatINR(breakdown.tax)})
                                </p>
                            </div>

                            {/* Breakdown List */}
                            <div className="p-8 pt-6 flex-1 bg-white">
                                <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-wider">Cost Breakdown</h4>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Base Risk Premium</span>
                                        <span className="text-gray-900 font-bold">₹{formatINR(breakdown.riskPremium)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 flex items-center gap-1">Coverage Load <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{formatINR(input.coverageAmount)}</span></span>
                                        <span className="text-gray-900 font-bold">+ ₹{formatINR(breakdown.coveragePremium)}</span>
                                    </div>
                                    <div className="my-2 border-t border-gray-200 border-dashed"></div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500">Annual Subtotal</span>
                                        <span className="text-gray-900 font-bold">₹{formatINR(breakdown.annualPremium)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-100 mt-2">
                                        <span className="text-gray-700 font-medium">Prorated ({input.duration} Months)</span>
                                        <span className="text-indigo-600 font-black">₹{formatINR(breakdown.finalPremium)}</span>
                                    </div>
                                </div>
                                
                                <button className="mt-8 w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all transform hover:-translate-y-0.5 outline-none focus:ring-4 focus:ring-indigo-100">
                                    Browse Matching Policies →
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-5 hidden lg:block">
                        <div className="h-full rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center">
                            <p className="text-gray-400 font-medium text-sm">Adjust sliders to calculate premium.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PremiumCalculator;
