import React, { useState, useEffect } from 'react';
import { Shield, Car, HeartPulse, Home, Calculator, User } from 'lucide-react';

const policyTypes = [
    { id: 'health', label: 'Health', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', activeBorder: 'border-rose-500', activeRing: 'ring-rose-500' },
    { id: 'auto', label: 'Auto', icon: Car, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', activeBorder: 'border-blue-500', activeRing: 'ring-blue-500' },
    { id: 'life', label: 'Life', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', activeBorder: 'border-emerald-500', activeRing: 'ring-emerald-500' },
    { id: 'home', label: 'Home', icon: Home, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', activeBorder: 'border-amber-500', activeRing: 'ring-amber-500' },
];

const durations = [
    { value: '6', label: '6 Months' },
    { value: '12', label: '1 Year' },
    { value: '24', label: '2 Years' },
];

const PremiumCalculator = () => {
    const [input, setInput] = useState({
        age: 30,
        policyType: 'health',
        coverageAmount: 100000,
        duration: '12'
    });
    const [result, setResult] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Auto calculate when inputs change after initial calculation
    useEffect(() => {
        if (result !== null) {
            handleCalculate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [input]);

    const handleCalculate = () => {
        // Base rate
        let baseRate = 100;

        // Type multiplier
        if (input.policyType === 'health') baseRate *= 1.5;
        if (input.policyType === 'auto') baseRate *= 1.2;
        if (input.policyType === 'life') baseRate *= 2.0;
        if (input.policyType === 'home') baseRate *= 1.3;

        // Age multiplier
        const age = parseInt(input.age) || 0;
        if (age > 50) baseRate *= 1.5;
        else if (age > 30) baseRate *= 1.2;
        else if (age < 25) baseRate *= 1.8; // young risk factor

        // Coverage multiplier
        const coverage = parseInt(input.coverageAmount) || 0;
        baseRate += (coverage / 1000) * 2;

        // Duration
        const months = parseInt(input.duration);
        const totalPremium = baseRate * (months / 12);

        setResult(totalPremium.toFixed(2));
    };

    const onSubmit = (e) => {
        e.preventDefault();
        setIsCalculating(true);
        setTimeout(() => {
            handleCalculate();
            setIsCalculating(false);
        }, 600); // Fake calculating delay for better UX feel
    };

    return (
        <div className="bg-white/90 backdrop-blur-xl shadow-2xl sm:rounded-2xl overflow-hidden border border-gray-100 transition-all duration-300 transform-gpu hover:shadow-indigo-100/50">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 sm:px-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 filter blur-sm">
                    <Calculator size={160} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-3xl leading-snug font-bold flex items-center gap-3">
                        <Calculator className="w-8 h-8 opacity-90" />
                        Premium Calculator
                    </h3>
                    <p className="mt-2 text-indigo-100 text-base max-w-xl">
                        Adjust parameters to get an instant tailored insurance quote.
                    </p>
                </div>
            </div>
            
            <div className="px-6 py-6 sm:p-8">
                <form onSubmit={onSubmit} className="space-y-8">
                    
                    {/* Policy Type Selection */}
                    <div>
                        <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wide">1. Select Insurance Type</label>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            {policyTypes.map((type) => {
                                const isSelected = input.policyType === type.id;
                                const Icon = type.icon;
                                return (
                                    <div 
                                        key={type.id}
                                        onClick={() => setInput({ ...input, policyType: type.id })}
                                        className={`cursor-pointer group relative rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center transition-all duration-300 border-2 ${
                                            isSelected 
                                                ? `${type.activeBorder} ${type.bg} shadow-md scale-[1.02] transform-gpu ring-2 ${type.activeRing} ring-offset-1` 
                                                : `border-gray-100 hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-1`
                                        }`}
                                    >
                                        <div className={`p-3 rounded-full transition-colors duration-300 ${isSelected ? 'bg-white shadow-sm' : type.bg}`}>
                                            <Icon className={`w-7 h-7 ${type.color} ${isSelected ? 'animate-pulse' : ''}`} />
                                        </div>
                                        <span className={`text-sm font-semibold tracking-tight ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                            {type.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-8 gap-x-8 sm:grid-cols-2">
                        {/* Age Input */}
                        <div>
                            <label htmlFor="age" className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wide">2. Your Age</label>
                            <div className="relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="number"
                                    name="age"
                                    id="age"
                                    required
                                    min="18"
                                    max="100"
                                    value={input.age}
                                    onChange={e => setInput({ ...input, age: e.target.value })}
                                    className="pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full text-lg border-2 border-gray-100 rounded-xl py-3 transition-shadow bg-gray-50/50"
                                    placeholder="e.g. 30"
                                />
                            </div>
                        </div>

                        {/* Duration Buttons */}
                        <div>
                            <label className="text-sm font-bold text-gray-700 mb-3 block uppercase tracking-wide">3. Policy Duration</label>
                            <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200/60 shadow-inner">
                                {durations.map(duration => (
                                    <button
                                        key={duration.value}
                                        type="button"
                                        onClick={() => setInput({ ...input, duration: duration.value })}
                                        className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 ${
                                            input.duration === duration.value 
                                            ? 'bg-white text-indigo-700 shadow ring-1 ring-black/5 scale-[1.02]' 
                                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                                        }`}
                                    >
                                        {duration.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Coverage Amount (Slider + Input) */}
                    <div className="bg-indigo-50/30 p-5 rounded-2xl border border-indigo-50">
                        <div className="flex justify-between items-end mb-4">
                            <label htmlFor="coverageAmount" className="text-sm font-bold text-gray-700 block uppercase tracking-wide">4. Coverage Amount</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-indigo-400 font-bold">$</span>
                                </div>
                                <input
                                    type="number"
                                    value={input.coverageAmount}
                                    onChange={e => setInput({ ...input, coverageAmount: parseInt(e.target.value) || 0 })}
                                    className="pl-7 block w-full sm:w-40 border-0 bg-white shadow-sm rounded-lg py-2 text-right text-indigo-700 font-black text-xl focus:ring-2 focus:ring-indigo-500 transition-all"
                                    min="10000"
                                    max="2000000"
                                    step="10000"
                                />
                            </div>
                        </div>
                        <div className="px-2 pt-2">
                            <input
                                type="range"
                                min="10000"
                                max="2000000"
                                step="10000"
                                value={input.coverageAmount}
                                onChange={e => setInput({ ...input, coverageAmount: parseInt(e.target.value) })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
                            />
                            <div className="flex justify-between text-xs text-indigo-400/80 mt-3 font-bold uppercase tracking-wider">
                                <span>$10k</span>
                                <span>$1M</span>
                                <span>$2M</span>
                            </div>
                        </div>
                    </div>

                    {!result && (
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isCalculating}
                                className="w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent shadow-xl shadow-indigo-200 text-lg font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all active:scale-[0.98] transform-gpu disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isCalculating ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Calculating Best Rates...
                                    </>
                                ) : (
                                    <>Discover Your Premium ➔</>
                                )}
                            </button>
                        </div>
                    )}
                </form>

                {/* Elaborate Result Display */}
                <div 
                    className={`mt-8 relative transition-all duration-700 transform-gpu origin-top ${
                        result ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none hidden'
                    }`}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur-xl opacity-20 sm:opacity-30"></div>
                    <div className="relative bg-gradient-to-br from-white to-indigo-50/50 p-6 sm:p-8 rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-100/30 text-center backdrop-blur-sm">
                        <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2">Estimated Amount</p>
                        <div className="flex justify-center items-end gap-1 mb-3">
                            <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                                ${result ? Number(result).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 bg-white/60 inline-block px-4 py-1.5 rounded-full border border-gray-100">
                            per {input.duration}-month term
                        </p>
                        
                        <p className="mt-5 text-sm text-gray-600 mx-auto max-w-sm font-medium leading-relaxed">
                            Based on a <span className="text-gray-900 font-bold">{input.age} year old</span> seeking <span className="text-gray-900 font-bold">{policyTypes.find(t=>t.id === input.policyType)?.label} insurance</span> with a coverage of <strong className="text-gray-900">${Number(input.coverageAmount).toLocaleString()}</strong>.
                        </p>
                        
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                            <button className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg hover:bg-gray-800 hover:shadow-xl transition-all active:scale-95 transform-gpu flex-1 sm:flex-none">
                                Proceed to Apply
                            </button>
                            <button 
                                onClick={() => setResult(null)} 
                                className="px-8 py-3 bg-white text-gray-700 font-bold rounded-xl shadow-sm border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 transform-gpu flex-1 sm:flex-none"
                            >
                                Reset Form
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PremiumCalculator;
