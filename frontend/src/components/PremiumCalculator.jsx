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
    
    setCalculatedPremium(Math.round(finalResult).toFixed(0));

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
    <div className="bg-slate-50/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-yellow-400 my-8 shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 leading-tight uppercase">
            {policyType.toUpperCase()} Premium Estimator
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Covermate v2.6</p>
        </div>
        <div className="text-right">
          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter ${
            userRiskProfile?.level === 'High' ? 'bg-red-500 text-white' : 
            userRiskProfile?.level === 'Medium' ? 'bg-yellow-500 text-white' :
            'bg-yellow-400 text-slate-900'
          }`}>
            {userRiskProfile?.level || 'LOW'} RISK
          </span>
        </div>
      </div>
      
      <div className="mb-8 px-2">
        <div className="flex justify-between items-end mb-4">
          <label className="text-xs font-black text-slate-500 uppercase tracking-widest">
            Coverage Amount ({policyType})
          </label>
          <span className="text-2xl font-black text-slate-900">₹{coverageAmount.toLocaleString()}</span>
        </div>
        <input 
          type="range" 
          min={range.min}
          max={range.max}
          step={range.step}
          value={coverageAmount}
          onChange={(e) => setCoverageAmount(Number(e.target.value))}
          className="w-full h-3 bg-slate-200 rounded-full appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all"
        />
        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
          <span>₹{range.min.toLocaleString()}</span>
          <span>₹{range.max.toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-md border border-yellow-100 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] text-yellow-600 font-black uppercase tracking-[0.2em]">Annual Quote</p>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-slate-900">₹</span>
            <span className="text-4xl font-black text-slate-900 tracking-tighter">
              {Number(calculatedPremium).toLocaleString()}
            </span>
          </div>
        </div>
        
        <button className="bg-yellow-400 text-slate-900 h-14 px-8 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-yellow-500 hover:-translate-y-1 transition-all active:scale-95 shadow-md shadow-yellow-200">
          Proceed
        </button>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2">
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Age</p>
          <p className="text-xs font-black text-slate-700">{calculateAge(userDob)} years</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Risk Level</p>
          <p className="text-xs font-black text-slate-700">{userRiskProfile?.level || 'Standard'}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-400 uppercase">Policy Type</p>
          <p className="text-xs font-black text-slate-700 capitalize">{policyType}</p>
        </div>
      </div>
      
      {userRiskProfile?.health_declarations && userRiskProfile.health_declarations !== "None" && (
        <div className="mt-2 pt-2 border-t border-slate-200">
          <p className="text-[9px] font-bold text-slate-400 uppercase">Risk Factors</p>
          <p className="text-xs font-medium text-amber-600 italic truncate">
            {userRiskProfile.health_declarations}
          </p>
        </div>
      )}
    </div>
  );
};

export default PremiumCalculator;