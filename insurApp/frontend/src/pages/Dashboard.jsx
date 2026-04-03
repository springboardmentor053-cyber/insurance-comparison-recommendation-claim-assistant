import React, { useState, useEffect } from 'react';
import { claimsAPI, recommendationsAPI } from '../api';
import { FileText, Award, AlertCircle, Sparkles, Scale, Calculator, Trash2 } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [compareList, setCompareList] = useState([]);
  
  // Calculator State
  const [calcAge, setCalcAge] = useState(30);
  const [calcCoverage, setCalcCoverage] = useState(100000);
  const [calcDeductible, setCalcDeductible] = useState(1000);
  const [calcHealth, setCalcHealth] = useState('Excellent');
  const [estimatedPremium, setEstimatedPremium] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('insurance_compare_list');
    if (saved) {
      try {
        setCompareList(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load compare list', e);
      }
    }
  }, []);

  const removeFromCompare = (id) => {
    const newList = compareList.filter(p => p.id !== id);
    setCompareList(newList);
    localStorage.setItem('insurance_compare_list', JSON.stringify(newList));
  };

  useEffect(() => {
    let base = 50;
    let ageFactor = calcAge > 30 ? (calcAge - 30) * 1.5 : 0;
    let coverageFactor = (calcCoverage / 1000) * 0.5;
    let deductibleDiscount = (calcDeductible / 100) * 0.5;
    
    let healthFactor = 1;
    if (calcHealth === 'Good') healthFactor = 1.2;
    if (calcHealth === 'Fair') healthFactor = 1.5;
    
    let total = (base + ageFactor + coverageFactor - deductibleDiscount) * healthFactor;
    setEstimatedPremium(Math.max(10, total));
  }, [calcAge, calcCoverage, calcDeductible, calcHealth]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [claimsRes, recRes] = await Promise.all([
          claimsAPI.getClaims(),
          recommendationsAPI.get().catch(() => ({ data: [] }))
        ]);
        setClaims(claimsRes.data);
        setRecommendations(recRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const generateRecommendations = async () => {
    try {
      await recommendationsAPI.generate();
      const res = await recommendationsAPI.get();
      setRecommendations(res.data);
    } catch (err) {
      alert('Failed to generate recommendations');
    }
  };

  if (loading) return <div className="text-center p-10 text-xl">Loading dashboard...</div>;

  return (
    <div className="max-w-7xl relative space-y-12 pb-12">
      <div className="page-header mt-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, <span className="gradient-text">{user?.full_name}</span></h1>
        <p className="text-muted">Here's what's happening with your insurance today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Claims Section */}
        <section className="glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="text-primary" /> My Claims
            </h2>
            <Link to="/file-claim" className="btn btn-primary text-sm py-2 px-4">New Claim</Link>
          </div>
          
          <div className="space-y-4">
            {claims.length === 0 ? (
              <div className="text-center p-6 text-muted border border-dashed border-[var(--border)] rounded-lg">
                <AlertCircle className="mx-auto mb-2 opacity-50" size={32} />
                No claims filed yet.
              </div>
            ) : (
              claims.map(claim => (
                <div key={claim.id} className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--border)] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold">{claim.claim_number}</h3>
                      <p className="text-sm text-muted">{claim.claim_type}</p>
                    </div>
                    <span className={`badge badge-${claim.status}`}>{claim.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <span className="text-xl font-bold text-emerald-400">
                      ${claim.claim_amount.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted">
                      {new Date(claim.filed_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recommendations Section */}
        <section className="glass p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-secondary" /> Recommended Policies
            </h2>
            <div className="flex gap-3">
              <Link to="/profile" className="btn btn-secondary text-sm py-2 px-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                Preferences
              </Link>
              <button onClick={generateRecommendations} className="btn btn-primary text-sm py-2 px-4">
                Refresh Matches
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center p-6 text-muted border border-dashed border-[var(--border)] rounded-lg">
                <Award className="mx-auto mb-2 opacity-50" size={32} />
                Generate recommendations to see targeted policies.
              </div>
            ) : (
              recommendations.map(rec => (
                <div key={rec.id} className="p-4 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[var(--border)] relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 text-xs font-bold bg-secondary/20 text-secondary rounded-bl-lg">
                    {Math.round(rec.score)}% Match
                  </div>
                  <h3 className="font-bold text-lg mb-1">{rec.policy.name}</h3>
                  <p className="text-sm text-muted mb-3 line-clamp-2">{rec.policy.description}</p>
                  <p className="font-semibold text-primary-glow">
                    ${rec.policy.premium_monthly}/mo
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Compare Insurance Section */}
      <section className="glass p-6 mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="text-purple-400" /> Compare Policies
          </h2>
          <Link to="/policies" className="btn btn-secondary text-sm py-2 px-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            Add to Compare
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {compareList.length === 0 ? (
            <div className="col-span-full text-center p-8 text-muted border border-dashed border-[var(--border)] rounded-xl bg-black/10">
              <Scale className="mx-auto mb-3 opacity-40" size={40} />
              <p className="text-lg font-medium">No policies selected for comparison.</p>
              <p className="text-sm mt-1">Visit the Browse Policies page to add up to 3 policies.</p>
            </div>
          ) : (
            compareList.map(policy => (
              <div key={policy.id} className="relative p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-slate-700 shadow-xl flex flex-col h-full">
                <button 
                  onClick={() => removeFromCompare(policy.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-400 transition-colors p-1"
                  title="Remove"
                >
                  <Trash2 size={20} />
                </button>
                <div className="mb-4">
                  <span className="px-3 py-1 bg-primary/20 text-primary-glow font-bold text-xs uppercase tracking-wider rounded-full">
                    {policy.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{policy.name}</h3>
                <div className="text-3xl font-extrabold text-emerald-400 mb-6 border-b border-slate-700 pb-4">
                  ${policy.premium_monthly.toLocaleString()}<span className="text-base text-slate-400 font-normal">/mo</span>
                </div>
                
                <div className="space-y-4 flex-grow mb-6">
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Coverage Amount</p>
                    <p className="font-semibold text-white">${policy.coverage_amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">Deductible</p>
                    <p className="font-semibold text-white">${policy.deductible.toLocaleString()}</p>
                  </div>
                </div>
                <button className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-white font-bold transition-colors">
                  Select Policy
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Premium Calculator Section */}
      <section className="glass p-8 mt-8 border-t-4 border-indigo-500">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1 w-full space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Calculator className="text-indigo-400" /> Premium Calculator
            </h2>
            <p className="text-muted text-sm mb-6">
              Estimate your monthly premium instantly by adjusting the parameters below.
            </p>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <label className="text-slate-300">Your Age</label>
                  <span className="text-primary-glow font-bold">{calcAge} years</span>
                </div>
                <input 
                  type="range" min="18" max="80" 
                  value={calcAge} onChange={(e) => setCalcAge(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: '#6366f1' }}
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <label className="text-slate-300">Desired Coverage Amount</label>
                  <span className="text-primary-glow font-bold">${calcCoverage.toLocaleString()}</span>
                </div>
                <input 
                  type="range" min="10000" max="1000000" step="10000"
                  value={calcCoverage} onChange={(e) => setCalcCoverage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: '#6366f1' }}
                />
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2 font-medium">
                  <label className="text-slate-300">Deductible (Out of Pocket)</label>
                  <span className="text-primary-glow font-bold">${calcDeductible.toLocaleString()}</span>
                </div>
                <input 
                  type="range" min="500" max="5000" step="500"
                  value={calcDeductible} onChange={(e) => setCalcDeductible(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: '#6366f1' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">Self-assessed Health / Risk Level</label>
                <div className="flex gap-3">
                  {['Excellent', 'Good', 'Fair'].map(level => (
                    <button
                      key={level}
                      onClick={() => setCalcHealth(level)}
                      className={`py-1.5 px-4 rounded-lg text-sm font-bold border transition-all ${
                        calcHealth === level 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] transform scale-[1.02]' 
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-1/3 bg-slate-900 rounded-3xl p-8 border border-slate-700 shadow-2xl flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[50px] rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/20 blur-[50px] rounded-full"></div>
            
            <h3 className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-4 relative z-10">Estimated Premium</h3>
            <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-200 mb-2 relative z-10">
              ${Math.round(estimatedPremium)}<span className="text-xl text-slate-500 font-medium">/mo</span>
            </div>
            <p className="text-xs text-slate-500 mt-6 relative z-10">
              *Estimate is highly dynamic and subject to full underwriting approval.
            </p>
            <button className="mt-8 relative z-10 w-full py-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all border border-white/20 backdrop-blur-sm shadow-[0_4px_15px_rgba(0,0,0,0.3)]">
              Apply For This Rate
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
