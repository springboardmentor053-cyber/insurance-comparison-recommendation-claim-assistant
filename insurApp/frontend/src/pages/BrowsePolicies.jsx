import React, { useState, useEffect } from 'react';
import { policyAPI } from '../api';
import { Shield, Search, Filter, ShieldCheck, DollarSign, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BrowsePolicies = () => {
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [compareList, setCompareList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem('insurance_compare_list');
    if (saved) {
      try {
        setCompareList(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse compare list', e);
      }
    }
  }, []);

  const handleAddToCompare = (policy) => {
    if (compareList.some(p => p.id === policy.id)) {
      navigate('/dashboard');
      return;
    }
    if (compareList.length >= 3) {
      alert("You can only compare up to 3 policies at a time.");
      return;
    }
    const newList = [...compareList, policy];
    setCompareList(newList);
    localStorage.setItem('insurance_compare_list', JSON.stringify(newList));
  };

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await policyAPI.getPolicies();
        setPolicies(res.data);
        setFilteredPolicies(res.data);
      } catch (err) {
        console.error('Failed to fetch policies', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  useEffect(() => {
    let result = policies;
    if (selectedType !== 'all') {
      result = result.filter(p => p.type.toLowerCase() === selectedType.toLowerCase());
    }
    if (searchTerm) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredPolicies(result);
  }, [searchTerm, selectedType, policies]);

  const uniqueTypes = ['all', ...new Set(policies.map(p => p.type.toLowerCase()))];

  if (loading) return <div className="text-center p-12 text-xl font-medium animate-pulse">Loading amazing policies...</div>;

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-4 flex items-center justify-center gap-3">
          <Shield className="text-primary" size={40} /> 
          Browse <span className="gradient-text">Insurance Policies</span>
        </h1>
        <p className="text-lg text-muted max-w-2xl mx-auto">
          Explore our expansive catalog of elite insurance offerings. Discover exactly what covers you best before diving into recommendations.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10 bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <input 
            type="text" 
            placeholder="Search policies by name or keywords..." 
            className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-primary outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={20} />
          <select 
            className="w-full pl-12 pr-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-primary transition-all capitalize"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type === 'all' ? 'All Coverage Types' : type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredPolicies.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted border border-dashed border-[var(--border)] rounded-2xl glass">
            <ShieldCheck size={48} className="mx-auto mb-4 opacity-50 text-primary" />
            <h3 className="text-2xl font-bold mb-2">No Match Found</h3>
            <p>We couldn't find any policies matching your current filters.</p>
            <button onClick={() => {setSearchTerm(''); setSelectedType('all');}} className="mt-4 btn btn-secondary">
              Clear Filters
            </button>
          </div>
        ) : (
          filteredPolicies.map(policy => (
            <div key={policy.id} className="glass p-6 group hover:translate-y-[-4px] transition-all duration-300 flex flex-col h-full rounded-2xl border border-[var(--border)] bg-white shadow-sm hover:shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary-glow font-bold text-xs uppercase tracking-wider rounded-full border border-primary/20">
                  {policy.type}
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-text mb-3 leading-tight group-hover:text-primary transition-colors">
                {policy.name}
              </h3>
              
              <p className="text-sm text-muted mb-6 flex-grow line-clamp-3 leading-relaxed">
                {policy.description || 'A standard insurance policy designed to cover your fundamental risks with reliability.'}
              </p>
              
              <div className="space-y-4 pt-5 border-t border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-muted">
                    <Activity size={16} className="text-emerald-500" /> Total Coverage
                  </span>
                  <span className="font-extrabold text-emerald-600 text-lg">${policy.coverage_amount.toLocaleString()}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-muted">
                    <DollarSign size={16} className="text-blue-500" /> Monthly Premium
                  </span>
                  <span className="font-bold text-text">${policy.premium_monthly.toLocaleString()}<span className="text-xs text-muted font-normal">/mo</span></span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium text-muted">
                    <ShieldCheck size={16} className="text-purple-500" /> Deductible
                  </span>
                  <span className="font-bold text-text">${policy.deductible.toLocaleString()}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleAddToCompare(policy)} 
                className={`w-full mt-6 py-3 rounded-lg font-bold tracking-wide transition-colors border ${
                  compareList.some(p => p.id === policy.id)
                    ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                }`}
              >
                {compareList.some(p => p.id === policy.id) ? 'Added to Compare -> Dashboard' : 'Add to Compare'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrowsePolicies;
