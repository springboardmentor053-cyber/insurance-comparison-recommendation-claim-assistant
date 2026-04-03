import { useState, useEffect } from 'react';
import API from '../api';
import PremiumCalculator from './PremiumCalculator';

const RecommendationsView = ({ onSelectPolicy, onBack }) => {
  const [allRecommendations, setAllRecommendations] = useState([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [explainingPolicy, setExplainingPolicy] = useState(null);
  const [explanation, setExplanation] = useState(null);
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [uniqueProviders, setUniqueProviders] = useState([]);
  const [sortBy, setSortBy] = useState('score'); // 'score', 'price_low', 'price_high'

  // Policy type icons and colors
  const policyTypeIcons = {
    'auto': '🚗',
    'health': '🏥',
    'life': '❤️',
    'home': '🏠',
    'travel': '✈️'
  };

  const policyTypeColors = {
    'auto': 'bg-blue-100 text-blue-600',
    'health': 'bg-green-100 text-green-600',
    'life': 'bg-purple-100 text-purple-600',
    'home': 'bg-orange-100 text-orange-600',
    'travel': 'bg-yellow-100 text-yellow-600'
  };

  useEffect(() => {
    loadAllRecommendations();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allRecommendations];
    
    // Filter by policy type
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(rec => selectedTypes.includes(rec.policy.policy_type));
    }
    
    // Filter by provider
    if (selectedProviders.length > 0) {
      filtered = filtered.filter(rec => selectedProviders.includes(rec.policy.provider_name));
    }
    
    // Filter by price range
    filtered = filtered.filter(rec => {
      const premium = rec.policy.premium;
      return premium >= priceRange.min && premium <= priceRange.max;
    });
    
    // Apply sorting
    if (sortBy === 'score') {
      filtered.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'price_low') {
      filtered.sort((a, b) => a.policy.premium - b.policy.premium);
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => b.policy.premium - a.policy.premium);
    }
    
    setFilteredRecommendations(filtered);
  }, [selectedTypes, selectedProviders, priceRange, sortBy, allRecommendations]);

  const loadAllRecommendations = async () => {
    setLoading(true);
    try {
      const res = await API.get('/recommendations/?limit=100');
      setAllRecommendations(res.data);
      setFilteredRecommendations(res.data);
      
      // Extract unique providers
      const providers = [...new Set(res.data.map(rec => rec.policy.provider_name))];
      setUniqueProviders(providers);
      
      // Set max price range
      const maxPrice = Math.max(...res.data.map(rec => rec.policy.premium));
      setPriceRange(prev => ({ ...prev, max: maxPrice }));
      
    } catch (err) {
      console.error('Failed to load recommendations', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshRecommendations = async () => {
    setLoading(true);
    try {
      await API.post('/recommendations/generate', { refresh: true });
      await loadAllRecommendations();
    } catch (err) {
      console.error('Failed to refresh', err);
    }
  };

  const getExplanation = async (policyId) => {
    try {
      const res = await API.get(`/recommendations/explain/${policyId}`);
      setExplanation(res.data);
    } catch (err) {
      console.error('Failed to get explanation', err);
    }
  };

  const toggleTypeFilter = (type) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const toggleProviderFilter = (provider) => {
    setSelectedProviders(prev => 
      prev.includes(provider) 
        ? prev.filter(p => p !== provider)
        : [...prev, provider]
    );
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedProviders([]);
    setSortBy('score');
    setPriceRange(prev => ({ ...prev, min: 0, max: Math.max(...allRecommendations.map(rec => rec.policy.premium)) }));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Low';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-black text-slate-900">🎯 All Recommendations</h1>
        </div>
        <button
          onClick={refreshRecommendations}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-400">Found:</span>
          <span className="text-2xl font-black text-blue-600">{filteredRecommendations.length}</span>
          <span className="text-sm font-bold text-slate-400">personalized matches</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 bg-slate-100 rounded-xl text-sm font-bold border-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="score">Best Match</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Filters section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-slate-900">Filter Recommendations</h3>
          <button
            onClick={clearFilters}
            className="text-xs font-bold text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Policy Type Filters */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Policy Type
            </label>
            <div className="space-y-2">
              {Object.keys(policyTypeIcons).map((type) => (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-between transition ${
                    selectedTypes.includes(type)
                      ? policyTypeColors[type] + ' border-2 border-current'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{policyTypeIcons[type]}</span>
                    <span className="capitalize">{type}</span>
                  </span>
                  {selectedTypes.includes(type) && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Filters */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Insurance Providers
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {uniqueProviders.map((provider) => (
                <button
                  key={provider}
                  onClick={() => toggleProviderFilter(provider)}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-between transition ${
                    selectedProviders.includes(provider)
                      ? 'bg-blue-100 text-blue-600 border-2 border-blue-200'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{provider}</span>
                  {selectedProviders.includes(provider) && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
              Price Range (₹)
            </label>
            <div className="px-2">
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-slate-600">₹{priceRange.min.toLocaleString()}</span>
                <span className="text-xs font-bold text-blue-600">₹{priceRange.max.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.max(...allRecommendations.map(rec => rec.policy.premium))}
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRecommendations.map((rec, index) => (
          <div
            key={rec.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition relative"
          >
            {/* Score badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getScoreColor(rec.score)}`}>
              {Math.round(rec.score)}% {getScoreLabel(rec.score)}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Policy info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full uppercase ${policyTypeColors[rec.policy.policy_type] || 'bg-slate-100 text-slate-500'}`}>
                    {policyTypeIcons[rec.policy.policy_type]} {rec.policy.policy_type}
                  </span>
                  <span className="text-xs font-bold text-slate-400">#{index + 1} pick</span>
                </div>
                
                <h3 className="text-xl font-black text-slate-900">{rec.policy.title}</h3>
                <p className="text-sm text-slate-400 mb-2">{rec.policy.provider_name}</p>
                
                <p className="text-slate-500 text-sm mb-3">{rec.policy.description}</p>

                <div className="flex flex-wrap gap-3 mb-3 text-sm">
                  <span className="text-blue-600 font-black">₹{rec.policy.premium.toLocaleString()}/year</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">Deductible: ₹{rec.policy.deductible.toLocaleString()}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">{rec.policy.term_months} months</span>
                </div>

                {/* Reason */}
                <div className="mb-3 p-3 bg-slate-50 rounded-xl border-l-4 border-blue-400">
                  <p className="text-sm text-slate-600 italic">{rec.reason}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setExplainingPolicy(rec.policy.id);
                      getExplanation(rec.policy.id);
                    }}
                    className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition"
                  >
                    Why this?
                  </button>
                  <button
                    onClick={() => onSelectPolicy?.(rec.policy)}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-blue-600 transition"
                  >
                    View Details
                  </button>
                </div>
              </div>

              {/* Calculator preview */}
              <div className="md:w-80">
                <PremiumCalculator
                  basePremium={rec.policy.premium}
                  userDob={localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).dob : null}
                  userRiskProfile={JSON.parse(localStorage.getItem('user') || '{}').risk_profile}
                  policyType={rec.policy.policy_type}
                />
              </div>
            </div>

            {/* Explanation modal */}
            {explainingPolicy === rec.policy.id && explanation && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white max-w-md w-full rounded-3xl p-8 relative">
                  <button
                    onClick={() => setExplainingPolicy(null)}
                    className="absolute top-4 right-4 text-3xl text-slate-300 hover:text-slate-900"
                  >
                    ×
                  </button>
                  <h3 className="text-2xl font-black text-slate-900 mb-4">Why we recommended this</h3>
                  <div className="space-y-4">
                    <p className="text-slate-600">{explanation.reason}</p>
                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="font-bold text-slate-700 mb-3">Score Breakdown</h4>
                      {explanation.breakdown && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Coverage Match:</span>
                            <span className="font-bold">{explanation.breakdown.coverage_score}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Premium:</span>
                            <span className="font-bold">{explanation.breakdown.premium_score}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Deductible:</span>
                            <span className="font-bold">{explanation.breakdown.deductible_score}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Type Match:</span>
                            <span className="font-bold">{explanation.breakdown.type_match_score}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredRecommendations.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-xl font-bold text-slate-400">No matches found</h3>
          <p className="text-slate-400">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsView;