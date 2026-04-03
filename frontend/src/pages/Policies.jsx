import { useEffect, useState, useRef } from "react";   // Added useRef
import { useNavigate } from "react-router-dom";
import API from "../api";
import PremiumCalculator from "../components/PremiumCalculator";
import RecommendationsList from "../components/RecommendationsList";
import RecommendationsView from "../components/RecommendationsView";
import PreferencesWizard from "../components/PreferencesWizard";

// Policy type color mapping for better UX
const policyTypeColors = {
  'life': 'bg-purple-100 text-purple-600',
  'health': 'bg-green-100 text-green-600',
  'auto': 'bg-blue-100 text-blue-600',
  'home': 'bg-orange-100 text-orange-600',
  'travel': 'bg-yellow-100 text-yellow-600'
};

// Policy type icons
const policyTypeIcons = {
  'life': '❤️',
  'health': '🏥',
  'auto': '🚗',
  'home': '🏠',
  'travel': '✈️'
};

function Policies({ showRecommendations: externalShowRecs, setShowRecommendations: externalSetShowRecs }) {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [filteredPolicies, setFilteredPolicies] = useState([]);
  const [selectedPolicies, setSelectedPolicies] = useState([]);
  const [viewingDetails, setViewingDetails] = useState(null);
  const [isComparing, setIsComparing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showFullRecommendations, setShowFullRecommendations] = useState(false);
  const [showPreferencesWizard, setShowPreferencesWizard] = useState(false);
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  
  // Filter states
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [uniqueProviders, setUniqueProviders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [user, setUser] = useState({ dob: "1996-01-01", risk_profile: {} });

  // Ref to prevent multiple calls to loadRecommendationsCount
  const isFetchingCount = useRef(false);

  // Load recommendations count
  const loadRecommendationsCount = async () => {
    try {
      const res = await API.get('/recommendations/?limit=100');
      setRecommendationsCount(res.data.length);
    } catch (err) {
      console.error('Failed to load recommendations count', err);
    }
  };

  // Handle view all recommendations
  const handleViewAllRecommendations = () => {
    setShowFullRecommendations(true);
  };

  // Handle back from full recommendations
  const handleBackFromFullRecommendations = () => {
    setShowFullRecommendations(false);
  };

  // Listen for toggle events from App.jsx
  useEffect(() => {
    const handleToggle = (event) => {
      setShowRecommendations(event.detail.show);
      // Reset full view when toggling from nav
      if (!event.detail.show) {
        setShowFullRecommendations(false);
      }
    };
    
    window.addEventListener('toggleRecommendations', handleToggle);
    return () => window.removeEventListener('toggleRecommendations', handleToggle);
  }, []);

  // Sync with external state if provided
  useEffect(() => {
    if (externalShowRecs !== undefined) {
      setShowRecommendations(externalShowRecs);
      if (!externalShowRecs) {
        setShowFullRecommendations(false);
      }
    }
  }, [externalShowRecs]);

  // Notify parent of changes
  useEffect(() => {
    if (externalSetShowRecs) {
      externalSetShowRecs(showRecommendations);
    }
  }, [showRecommendations, externalSetShowRecs]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(true);
    API.get("/policies")
      .then((res) => {
        setPolicies(res.data);
        setFilteredPolicies(res.data);
        
        // Extract unique providers
        const providers = [...new Set(res.data.map(p => p.provider?.name || p.provider_name || 'Covermate'))];
        setUniqueProviders(providers);
        
        // Set max price range
        const maxPrice = Math.max(...res.data.map(p => parseFloat(p.premium || 0)));
        setPriceRange(prev => ({ ...prev, max: maxPrice }));
        
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching policies:", err);
        setLoading(false);
      });
  }, []);

  // Load recommendations count when user is available and recommendations are showing
  useEffect(() => {
    if (user?.id && showRecommendations && !isFetchingCount.current) {
      isFetchingCount.current = true;
      loadRecommendationsCount().finally(() => {
        isFetchingCount.current = false;
      });
    }
  }, [user, showRecommendations]);

  // Apply filters
  useEffect(() => {
    let filtered = [...policies];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by policy type
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(p => selectedTypes.includes(p.policy_type));
    }
    
    // Filter by provider
    if (selectedProviders.length > 0) {
      filtered = filtered.filter(p => {
        const providerName = p.provider?.name || p.provider_name || 'Covermate';
        return selectedProviders.includes(providerName);
      });
    }
    
    // Filter by price range
    filtered = filtered.filter(p => {
      const premium = parseFloat(p.premium || 0);
      return premium >= priceRange.min && premium <= priceRange.max;
    });
    
    setFilteredPolicies(filtered);
  }, [selectedTypes, selectedProviders, priceRange, policies, searchTerm]);

  const toggleCompare = (policy) => {
    if (selectedPolicies.find((p) => p.id === policy.id)) {
      setSelectedPolicies(selectedPolicies.filter((p) => p.id !== policy.id));
    } else if (selectedPolicies.length < 3) {
      setSelectedPolicies([...selectedPolicies, policy]);
    } else {
      alert("Maximum 3 policies for comparison.");
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
    setSearchTerm("");
    setPriceRange(prev => ({ ...prev, min: 0, max: Math.max(...policies.map(p => parseFloat(p.premium || 0))) }));
  };

  const handlePreferencesComplete = () => {
    setShowPreferencesWizard(false);
    setShowRecommendations(true);
    setShowFullRecommendations(false);
    // Refresh user data
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-bold">Loading policies...</p>
        </div>
      </div>
    );
  }

  // --- COMPARISON MATRIX VIEW ---
  if (isComparing) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 px-4 pb-24">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Plan Comparison</h1>
            <p className="text-slate-500 font-medium">Technical breakdown of your selected COVERMATE plans</p>
          </div>
          <button 
            onClick={() => setIsComparing(false)} 
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 transition shadow-xl"
          >
            ← BACK TO CATALOG
          </button>
        </div>

        <div className="overflow-x-auto bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-8 border-b border-slate-100 text-slate-400 text-[10px] uppercase font-black tracking-widest">Specifications</th>
                {selectedPolicies.map((p) => (
                  <th key={p.id} className="p-8 border-b border-slate-100 min-w-64">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                      policyTypeColors[p.policy_type] || 'bg-slate-100 text-slate-500'
                    }`}>
                      {p.policy_type} {policyTypeIcons[p.policy_type]}
                    </span>
                    <h3 className="font-black text-slate-900 text-xl leading-tight mt-2">{p.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.provider?.name || p.provider_name || 'Covermate'}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr>
                <td className="p-8 border-b border-slate-50 font-bold text-slate-700">Annual Premium</td>
                {selectedPolicies.map((p) => (
                  <td key={p.id} className="p-8 border-b border-slate-50 text-blue-600 font-black text-2xl">
                    ₹{parseFloat(p.premium || 0).toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr className="bg-amber-50/30">
                <td className="p-8 border-b border-slate-50 font-bold text-slate-700">Deductible</td>
                {selectedPolicies.map((p) => (
                  <td key={p.id} className="p-8 border-b border-slate-50 text-amber-700 font-black">
                    ₹{parseFloat(p.deductible || 0).toLocaleString()}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-8 border-b border-slate-50 font-bold text-slate-700">Term (Months)</td>
                {selectedPolicies.map((p) => (
                  <td key={p.id} className="p-8 border-b border-slate-50 text-slate-500 font-medium">
                    {p.term_months || 12}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-8 font-bold text-slate-700">Coverage</td>
                {selectedPolicies.map((p) => (
                  <td key={p.id} className="p-8 space-y-3">
                    {p.coverage ? Object.entries(p.coverage).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                        <span className="text-[10px] uppercase font-bold text-slate-400">{key.replace('_', ' ')}</span>
                        <span className="font-bold text-slate-700">{typeof value === 'boolean' ? (value ? '✓' : '✕') : value}</span>
                      </div>
                    )) : "Standard Benefits"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-6">
      {/* Header section - NO matches badge here */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">POLICIES</h1>
          <p className="text-slate-500 font-bold text-sm mt-2">
            {user.name ? `Welcome back, ${user.name}! ` : ''}
            Showing {filteredPolicies.length} of {policies.length} plans
          </p>
        </div>
        <div className="flex items-center gap-4">
          {user.name && (
            <div className="text-xs font-bold text-slate-400">
              Risk Profile: <span className={`px-2 py-1 rounded-full ${
                user.risk_profile?.level === 'High' ? 'bg-red-100 text-red-600' : 
                user.risk_profile?.level === 'Medium' ? 'bg-yellow-100 text-yellow-600' : 
                'bg-green-100 text-green-600'
              }`}>
                {user.risk_profile?.level || 'Standard'}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-6 py-3 bg-white/80 backdrop-blur-sm rounded-2xl font-bold text-sm text-slate-700 border border-slate-200 shadow-lg hover:bg-white transition flex items-center gap-2"
          >
            <span>🔍</span> Filters
            {(selectedTypes.length > 0 || selectedProviders.length > 0 || searchTerm) && (
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-[10px] flex items-center justify-center">
                {selectedTypes.length + selectedProviders.length + (searchTerm ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* FILTERS SECTION - Only show when not in recommendations mode */}
      {showFilters && !showRecommendations && (
        <div className="mb-10 bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-xl p-8 animate-in slide-in-from-top-5 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-900">Filter Policies</h3>
            <button
              onClick={clearFilters}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Clear All Filters
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">
              Search Policies
            </label>
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Policy Type Filters */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 block">
                Policy Type
              </label>
              <div className="space-y-2">
                {Object.keys(policyTypeColors).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleTypeFilter(type)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition ${
                      selectedTypes.includes(type)
                        ? policyTypeColors[type].replace('text-', 'bg-').replace('100', '200') + ' border-2 border-current'
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 block">
                Insurance Providers
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {uniqueProviders.map((provider) => (
                  <button
                    key={provider}
                    onClick={() => toggleProviderFilter(provider)}
                    className={`w-full px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between transition ${
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-3 block">
                Price Range (₹)
              </label>
              <div className="px-2">
                <div className="flex justify-between mb-4">
                  <span className="text-sm font-bold text-slate-600">₹{priceRange.min.toLocaleString()}</span>
                  <span className="text-sm font-bold text-blue-600">₹{priceRange.max.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(...policies.map(p => parseFloat(p.premium || 0)))}
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Maximum price: ₹{priceRange.max.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RECOMMENDATIONS SECTION - Top 10 view */}
      {showRecommendations && !showFullRecommendations && (
        <div className="mb-12 animate-in slide-in-from-top-5 duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-slate-900">🎯 Personalized Recommendations</h2>
              {recommendationsCount > 0 && (
                <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Top 10 of {recommendationsCount} matches
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleViewAllRecommendations}
                className="text-sm font-bold text-blue-600 hover:text-blue-800"
              >
                View All ({recommendationsCount})
              </button>
              <button
                onClick={() => setShowPreferencesWizard(true)}
                className="text-sm font-bold text-blue-600 hover:text-blue-800"
              >
                Update Preferences
              </button>
            </div>
          </div>
          <RecommendationsList onSelectPolicy={(policy) => setViewingDetails(policy)} />
        </div>
      )}

      {/* FULL RECOMMENDATIONS VIEW - All recommendations with filters */}
      {showFullRecommendations && (
        <RecommendationsView 
          onSelectPolicy={(policy) => setViewingDetails(policy)}
          onBack={handleBackFromFullRecommendations}
        />
      )}

      {/* PREFERENCES WIZARD MODAL */}
      {showPreferencesWizard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative max-w-2xl w-full">
            <button
              onClick={() => setShowPreferencesWizard(false)}
              className="absolute -top-12 right-0 text-white text-4xl hover:text-slate-300"
            >
              ×
            </button>
            <PreferencesWizard 
              onComplete={handlePreferencesComplete}
            />
          </div>
        </div>
      )}

      {/* POLICIES GRID - Only show when NOT in recommendations mode */}
      {!showRecommendations && !showFullRecommendations && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-40">
            {filteredPolicies.map((p) => {
              const isSelected = selectedPolicies.some((item) => item.id === p.id);
              return (
                <div 
                  key={p.id} 
                  className={`group bg-white/90 backdrop-blur-sm border-2 rounded-3xl p-8 flex flex-col transition-all duration-500 ${
                    isSelected ? 'border-blue-600 shadow-2xl scale-[1.02]' : 'border-slate-200 shadow-lg hover:shadow-xl hover:bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1 ${
                      policyTypeColors[p.policy_type] || 'bg-slate-100 text-slate-500'
                    }`}>
                      <span>{policyTypeIcons[p.policy_type]}</span>
                      <span>{p.policy_type}</span>
                    </span>
                    <span className="text-2xl font-black text-blue-600">₹{parseFloat(p.premium || 0).toLocaleString()}</span>
                  </div>
                  
                  <h2 className="text-xl font-black text-slate-800 mb-2 leading-tight">{p.title}</h2>
                  
                  <div className="text-slate-400 text-xs font-bold mb-4 flex items-center gap-2 flex-wrap">
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-[10px] font-black">
                      {p.provider?.name || p.provider_name || 'Covermate'}
                    </span>
                    <span>•</span>
                    <span>Deductible: ₹{parseFloat(p.deductible || 0).toLocaleString()}</span>
                    <span>•</span>
                    <span>{p.term_months} Months</span>
                  </div>
                  
                  <p className="text-slate-500 text-sm mb-8 grow leading-relaxed">{p.description}</p>
                  
                  <div className="flex gap-3 mt-auto">
                    <button 
                      onClick={() => toggleCompare(p)} 
                      className={`flex-1 text-[11px] font-black uppercase tracking-widest py-4 rounded-2xl border-2 transition-all ${
                        isSelected ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {isSelected ? "Selected" : "Compare"}
                    </button>
                    <button 
                      onClick={() => setViewingDetails(p)} 
                      className="flex-1 text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white py-4 rounded-2xl hover:bg-blue-600 transition-all shadow-lg"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* NO RESULTS MESSAGE */}
          {filteredPolicies.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-black text-slate-400 mb-2">No policies found</h3>
              <p className="text-slate-400">Try adjusting your filters</p>
              <button
                onClick={clearFilters}
                className="mt-6 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            </div>
          )}
        </>
      )}

      {/* FLOATING ACTION BAR */}
      {selectedPolicies.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-3xl flex items-center justify-between shadow-2xl z-40 animate-in slide-in-from-bottom-20 border border-white/10">
          <div className="flex items-center gap-8 pl-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-r border-slate-800 pr-8">COMPARING</span>
            <div className="flex gap-3">
              {selectedPolicies.map((p) => (
                <div key={p.id} className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span>{policyTypeIcons[p.policy_type]}</span>
                    <span className="truncate max-w-25">{p.title}</span>
                  </span>
                  <button onClick={() => toggleCompare(p)} className="text-red-400 hover:text-white transition-colors text-lg">×</button>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setIsComparing(true)} 
            className="bg-blue-600 px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-500 transition-all active:scale-95 shadow-xl shadow-blue-900/40"
          >
            Launch Comparison Matrix
          </button>
        </div>
      )}

      {/* DETAILS MODAL */}
      {viewingDetails && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-xl w-full rounded-3xl p-10 shadow-2xl relative animate-in zoom-in duration-300">
            <button 
              onClick={() => setViewingDetails(null)} 
              className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 text-4xl font-light"
            >
              ×
            </button>
            <span className={`text-[11px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest inline-flex items-center gap-1 ${
              policyTypeColors[viewingDetails.policy_type] || 'bg-slate-100 text-slate-500'
            }`}>
              <span>{policyTypeIcons[viewingDetails.policy_type]}</span>
              <span>{viewingDetails.policy_type}</span>
            </span>
            <h2 className="text-3xl font-black text-slate-900 mt-4 mb-1 leading-tight">{viewingDetails.title}</h2>
            <p className="text-sm font-bold text-blue-600 mb-4">
              {viewingDetails.provider?.name || viewingDetails.provider_name || 'Covermate'}
            </p>
            
            {/* CALCULATOR COMPONENT */}
            <PremiumCalculator 
              basePremium={viewingDetails.premium} 
              userDob={user.dob} 
              userRiskProfile={user.risk_profile}
              policyType={viewingDetails.policy_type}
            />

            <p className="text-slate-500 text-sm leading-relaxed mb-8">{viewingDetails.description}</p>
            
            <div className="flex items-center justify-between gap-6 pt-4 border-t border-slate-100">
              <a 
                href={viewingDetails.tnc_url} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 font-black text-[10px] uppercase tracking-widest border-b-2 border-blue-100 hover:border-blue-600 transition-all pb-1"
              >
                Review Terms
              </a>
              <div className="flex gap-3">
                {/* BUY POLICY BUTTON */}
                <button 
                  onClick={async () => {
                    try {
                      await API.post(`/claims/buy-policy/${viewingDetails.id}`);
                      alert('Policy purchased successfully! You can now file a claim.');
                      setViewingDetails(null);
                    } catch (err) {
                      alert('Failed to purchase policy');
                    }
                  }}
                  className="bg-green-600 text-white px-6 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-green-700 transition-all"
                >
                  Buy Policy
                </button>
                {/* FILE CLAIM BUTTON */}
                <button 
                  onClick={() => {
                    setViewingDetails(null);
                    localStorage.setItem('claimPolicyId', viewingDetails.id);
                    navigate('/claims/new');
                  }}
                  className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all"
                >
                  File a Claim
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Policies;