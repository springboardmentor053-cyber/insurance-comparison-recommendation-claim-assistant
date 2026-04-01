import React, { useState, useEffect } from 'react';
import api from '../api/api';

function Policies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchPolicies();
  }, [filter]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const url = filter ? `/policies?policy_type=${filter}` : '/policies';
      const res = await api.get(url);
      setPolicies(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Premium Policies</h1>
          <p className="text-slate-500 font-medium">Curated coverage options from top-tier global providers</p>
        </div>
        
        <div className="relative group w-full md:w-auto">
          <select 
            className="w-full md:w-64 bg-white border-2 border-slate-100 px-6 py-4 rounded-2xl text-slate-700 font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all appearance-none cursor-pointer"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="auto">Auto Insurance</option>
            <option value="health">Health Insurance</option>
            <option value="life">Life Insurance</option>
            <option value="home">Home Insurance</option>
          </select>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : policies.length === 0 ? (
        <div className="card-premium p-20 text-center border-dashed border-2">
          <div className="text-5xl mb-6 opacity-20">🔍</div>
          <h3 className="text-xl font-bold text-slate-400">No policies found for this category</h3>
          <p className="text-slate-400 font-medium mt-2">Try selecting a different category or contact support.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {policies.map(policy => (
            <div key={policy.id} className="card-premium group flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                  {policy.type}
                </span>
                <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-500 transition-colors cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">{policy.name}</h3>
              <p className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2">
                <span className="w-5 h-5 bg-slate-900 rounded-md flex items-center justify-center text-[10px] text-white">i</span>
                By {policy.provider ? policy.provider.name : "Premium Partner"}
              </p>
              
              <div className="bg-slate-50 p-6 rounded-2xl mb-8 flex flex-col gap-4">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-xs">Premium</span>
                  <span className="text-blue-600 text-2xl font-black">${policy.premium_monthly.toFixed(2)}<span className="text-xs font-bold text-slate-400">/mo</span></span>
                </div>
                <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Coverage Limit</span>
                  <span className="text-slate-900 font-black">${policy.coverage_amount.toLocaleString()}</span>
                </div>
              </div>
              
              <button 
                className="btn-primary w-full group"
                onClick={() => alert(`Redirecting to apply for ${policy.name}...`)}
              >
                Start Application
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Policies;
