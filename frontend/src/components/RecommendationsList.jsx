import { useState, useEffect } from 'react';
import API from '../api';
import PremiumCalculator from './PremiumCalculator';

const RecommendationsList = ({ onSelectPolicy }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [explainingPolicy, setExplainingPolicy] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [totalAvailable, setTotalAvailable] = useState(0);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      // Get all recommendations first to know total count
      const allRes = await API.get('/recommendations/?limit=100');
      setTotalAvailable(allRes.data.length);
      
      // Then get only top 10 for display
      const res = await API.get('/recommendations/?limit=10');
      setRecommendations(res.data);
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
      await loadRecommendations();
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

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    if (score >= 40) return 'Fair Match';
    return 'Low Match';
  };

  // Policy type icons
  const policyTypeIcons = {
    'auto': '🚗',
    'health': '🏥',
    'life': '❤️',
    'home': '🏠',
    'travel': '✈️'
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12 bg-white/50 rounded-3xl">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="text-xl font-bold text-slate-400">No recommendations yet</h3>
        <p className="text-slate-400">Complete your preferences to get personalized recommendations</p>
        <button
          onClick={refreshRecommendations}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Top Picks for You</h2>
          <p className="text-sm text-slate-400 mt-1">
            Showing {recommendations.length} of {totalAvailable} personalized matches
          </p>
        </div>
        <button
          onClick={refreshRecommendations}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec, index) => (
          <div
            key={rec.id}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition relative overflow-hidden"
          >
            {/* Rank badge */}
            <div className="absolute top-0 left-0 bg-blue-600 text-white px-3 py-1 rounded-br-xl text-sm font-bold">
              #{index + 1}
            </div>

            <div className="flex flex-col md:flex-row gap-6 mt-4">
              {/* Policy info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-xs px-2 py-1 rounded-full uppercase ${
                      rec.policy.policy_type === 'auto' ? 'bg-blue-100 text-blue-600' :
                      rec.policy.policy_type === 'health' ? 'bg-green-100 text-green-600' :
                      rec.policy.policy_type === 'life' ? 'bg-purple-100 text-purple-600' :
                      rec.policy.policy_type === 'home' ? 'bg-orange-100 text-orange-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {policyTypeIcons[rec.policy.policy_type]} {rec.policy.policy_type}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-2">{rec.policy.title}</h3>
                    <p className="text-sm text-slate-400">{rec.policy.provider_name}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl font-black text-center ${getScoreColor(rec.score)}`}>
                    <div className="text-2xl">{Math.round(rec.score)}%</div>
                    <div className="text-[10px] uppercase">{getScoreLabel(rec.score)}</div>
                  </div>
                </div>

                <p className="text-slate-500 text-sm mt-4">{rec.policy.description}</p>

                <div className="flex gap-4 mt-4 text-sm">
                  <span className="text-blue-600 font-black">₹{rec.policy.premium.toLocaleString()}/year</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">Deductible: ₹{rec.policy.deductible.toLocaleString()}</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">{rec.policy.term_months} months</span>
                </div>

                {/* Reason */}
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border-l-4 border-blue-400">
                  <p className="text-sm text-slate-600 italic">{rec.reason}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
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

              {/* Quick calculator preview */}
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
                    <div>
                      <p className="text-slate-600 mb-2">{explanation.reason}</p>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl">
                      <h4 className="font-bold text-slate-700 mb-3">Score Breakdown</h4>
                      {explanation.breakdown && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Coverage Match:</span>
                            <span className="font-bold">{explanation.breakdown.coverage_score}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Premium Affordability:</span>
                            <span className="font-bold">{explanation.breakdown.premium_score}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Deductible Suitability:</span>
                            <span className="font-bold">{explanation.breakdown.deductible_score}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Policy Type Relevance:</span>
                            <span className="font-bold">{explanation.breakdown.type_match_score}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h4 className="font-bold text-blue-700 mb-2">Your Profile</h4>
                      <p className="text-sm text-blue-600">Age: {explanation.user_profile?.age} years</p>
                      <p className="text-sm text-blue-600 capitalize">Risk Appetite: {explanation.user_profile?.risk_appetite}</p>
                      <p className="text-sm text-blue-600 capitalize">Priority: {explanation.user_profile?.coverage_priority}</p>
                      <p className="text-sm text-blue-600">Family Size: {explanation.user_profile?.family_size}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationsList;