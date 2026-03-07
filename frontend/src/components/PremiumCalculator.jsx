import React, { useState, useEffect } from 'react';

const PremiumCalculator = ({ basePremium, userDob, userRiskProfile, policyType = 'health' }) => {
  const [coverageAmount, setCoverageAmount] = useState(100000);
  const [calculatedPremium, setCalculatedPremium] = useState(basePremium);

  const calculateAge = (dobString) => {
    if (!dobString) return 30;
    const birthDate = new Date(dobString);
    const today = new Date(); 
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getPolicyTypeFactor = (type) => {
    const factors = {
      'life': 1.3,
      'health': 1.2,
      'auto': 1.1,
      'home': 1.0,
      'travel': 0.8
    };
    return factors[type] || 1.0;
  };

  useEffect(() => {
    const age = calculateAge(userDob);
    let ageFactor = 1 + (Math.max(0, age - 25) * 0.02);
    
    let riskMultiplier = 1.0;
    const healthText = (userRiskProfile?.health_declarations || "").toLowerCase();
    const lifeText = (userRiskProfile?.lifestyle_activities || "").toLowerCase();

    const riskKeywords = {
      high: ["accident", "heart", "diabetes", "cancer", "stroke", "surgery"],
      medium: ["smoke", "asthma", "allergy", "anxiety"],
      low: ["mild", "occasional", "minor"]
    };
    
    riskKeywords.high.forEach(word => {
      if (healthText.includes(word) || lifeText.includes(word)) {
        riskMultiplier += 0.25;
      }
    });
    
    riskKeywords.medium.forEach(word => {
      if (healthText.includes(word) || lifeText.includes(word)) {
        riskMultiplier += 0.15;
      }
    });

    if (lifeText.includes("travel") || lifeText.includes("adventure")) {
      riskMultiplier += 0.10;
    }

    const policyFactor = getPolicyTypeFactor(policyType);
    const coverageFactor = coverageAmount / 100000;
    const finalResult = basePremium * ageFactor * riskMultiplier * coverageFactor * policyFactor;
    
    setCalculatedPremium(Math.round(finalResult));

  }, [coverageAmount, basePremium, userDob, userRiskProfile, policyType]);

  const getCoverageRange = () => {
    const ranges = {
      'life': { min: 500000, max: 10000000, step: 100000 },
      'health': { min: 100000, max: 5000000, step: 50000 },
      'auto': { min: 50000, max: 2000000, step: 25000 },
      'home': { min: 100000, max: 10000000, step: 100000 },
      'travel': { min: 10000, max: 1000000, step: 10000 }
    };
    return ranges[policyType] || ranges.health;
  };

  const range = getCoverageRange();

  return (
    <div className="bg-linear-to-br from-slate-50 to-white p-6 rounded-2xl border border-slate-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            {policyType.toUpperCase()} PREMIUM ESTIMATOR
          </h3>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
            COVERMATE v2.6
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black ${
          userRiskProfile?.level === 'High' ? 'bg-red-100 text-red-600' : 
          userRiskProfile?.level === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
          'bg-green-100 text-green-600'
        }`}>
          {userRiskProfile?.level || 'LOW'} RISK
        </div>
      </div>
      
      {/* Coverage Slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            COVERAGE AMOUNT ({policyType.toUpperCase()})
          </label>
          <span className="text-lg font-black text-slate-900">
            ₹{(coverageAmount / 100000).toFixed(1)}L
          </span>
        </div>
        
        <input 
          type="range" 
          min={range.min}
          max={range.max}
          step={range.step}
          value={coverageAmount}
          onChange={(e) => setCoverageAmount(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        
        <div className="flex justify-between mt-2">
          <span className="text-[10px] font-bold text-slate-400">
            ₹{(range.min / 100000).toFixed(1)}L
          </span>
          <span className="text-[10px] font-bold text-slate-400">
            ₹{(range.max / 100000).toFixed(1)}L
          </span>
        </div>
      </div>

      {/* Quote */}
      <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-[8px] font-black text-blue-600 uppercase tracking-wider mb-1">
            ANNUAL QUOTE
          </p>
          <div className="flex items-baseline">
            <span className="text-xl font-black text-slate-900">₹</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">
              {calculatedPremium.toLocaleString()}
            </span>
          </div>
        </div>
        
        <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          PROCEED
        </button>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase">Age</p>
          <p className="text-xs font-black text-slate-700">{calculateAge(userDob)}</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase">Term</p>
          <p className="text-xs font-black text-slate-700">12m</p>
        </div>
        <div>
          <p className="text-[8px] font-bold text-slate-400 uppercase">Type</p>
          <p className="text-xs font-black text-slate-700 capitalize">{policyType}</p>
        </div>
      </div>
    </div>
  );
};

export default PremiumCalculator;