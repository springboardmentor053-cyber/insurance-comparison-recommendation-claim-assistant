import { useState, useEffect } from 'react';
import API from '../api';

const PreferencesWizard = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    income: '',
    family_size: 1,
    smoker: false,
    existing_conditions: [],
    risk_appetite: 'medium',
    coverage_priority: 'balanced',
    preferred_policy_types: [],
    max_budget: '',
    employment_type: '',
    travel_frequency: '',
    vehicle_owned: false,
    home_owned: false
  });

  const [customCondition, setCustomCondition] = useState('');

  // Load existing preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await API.get('/recommendations/preferences');
        setPreferences(prev => ({ ...prev, ...res.data }));
      } catch (err) {
        console.error('No existing preferences');
      }
    };
    loadPreferences();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePolicyTypeToggle = (type) => {
    setPreferences(prev => ({
      ...prev,
      preferred_policy_types: prev.preferred_policy_types.includes(type)
        ? prev.preferred_policy_types.filter(t => t !== type)
        : [...prev.preferred_policy_types, type]
    }));
  };

  const addCondition = () => {
    if (customCondition && !preferences.existing_conditions.includes(customCondition)) {
      setPreferences(prev => ({
        ...prev,
        existing_conditions: [...prev.existing_conditions, customCondition]
      }));
      setCustomCondition('');
    }
  };

  const removeCondition = (condition) => {
    setPreferences(prev => ({
      ...prev,
      existing_conditions: prev.existing_conditions.filter(c => c !== condition)
    }));
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      await API.post('/recommendations/preferences', preferences);
      
      // Generate recommendations after saving preferences
      await API.post('/recommendations/generate', { refresh: true });
      
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Failed to save preferences', err);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">Personalize Your Experience</h2>
        <p className="text-slate-400 text-sm mt-1">Step {step} of 4: Tell us about yourself for better recommendations</p>
        
        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-100 rounded-full mt-4">
          <div 
            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6 animate-in fade-in">
          <h3 className="font-black text-lg text-slate-700">Basic Information</h3>
          
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Annual Income (₹)
            </label>
            <input
              type="number"
              name="income"
              value={preferences.income}
              onChange={handleChange}
              placeholder="e.g., 600000"
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Family Size
            </label>
            <select
              name="family_size"
              value={preferences.family_size}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num}>{num} {num === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Employment Type
            </label>
            <select
              name="employment_type"
              value={preferences.employment_type}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-400 outline-none"
            >
              <option value="">Select</option>
              <option value="salaried">Salaried</option>
              <option value="self_employed">Self Employed</option>
              <option value="business">Business Owner</option>
              <option value="student">Student</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="smoker"
              checked={preferences.smoker}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm font-medium text-slate-700">I am a smoker</label>
          </div>
        </div>
      )}

      {/* Step 2: Health & Risk */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in">
          <h3 className="font-black text-lg text-slate-700">Health & Risk Profile</h3>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Existing Medical Conditions
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={customCondition}
                onChange={(e) => setCustomCondition(e.target.value)}
                placeholder="e.g., diabetes, asthma"
                className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-200"
              />
              <button
                onClick={addCondition}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.existing_conditions.map(condition => (
                <span key={condition} className="bg-slate-100 px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                  {condition}
                  <button onClick={() => removeCondition(condition)} className="text-red-500 hover:text-red-700">×</button>
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Risk Appetite
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['low', 'medium', 'high'].map(risk => (
                <button
                  key={risk}
                  onClick={() => setPreferences(prev => ({ ...prev, risk_appetite: risk }))}
                  className={`p-4 rounded-2xl border-2 font-bold capitalize transition ${
                    preferences.risk_appetite === risk
                      ? risk === 'low' ? 'border-green-500 bg-green-50 text-green-700'
                      : risk === 'medium' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  {risk}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {preferences.risk_appetite === 'low' && 'Low risk: Prefer lower deductibles, comprehensive coverage'}
              {preferences.risk_appetite === 'medium' && 'Medium risk: Balanced approach to coverage and cost'}
              {preferences.risk_appetite === 'high' && 'High risk: Comfortable with higher deductibles for lower premiums'}
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Lifestyle & Assets */}
      {step === 3 && (
        <div className="space-y-6 animate-in fade-in">
          <h3 className="font-black text-lg text-slate-700">Lifestyle & Assets</h3>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Travel Frequency
            </label>
            <select
              name="travel_frequency"
              value={preferences.travel_frequency}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200"
            >
              <option value="">Select</option>
              <option value="rarely">Rarely (0-1 trips/year)</option>
              <option value="occasionally">Occasionally (2-4 trips/year)</option>
              <option value="frequently">Frequently (5+ trips/year)</option>
            </select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="vehicle_owned"
                checked={preferences.vehicle_owned}
                onChange={handleChange}
                className="w-5 h-5 rounded"
              />
              <label className="text-sm font-medium">I own a vehicle</label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="home_owned"
                checked={preferences.home_owned}
                onChange={handleChange}
                className="w-5 h-5 rounded"
              />
              <label className="text-sm font-medium">I own a home</label>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Preferences */}
      {step === 4 && (
        <div className="space-y-6 animate-in fade-in">
          <h3 className="font-black text-lg text-slate-700">Coverage Preferences</h3>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Coverage Priority
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'low_cost', label: 'Low Cost', desc: 'Best price' },
                { value: 'balanced', label: 'Balanced', desc: 'Value for money' },
                { value: 'maximum_coverage', label: 'Max Coverage', desc: 'Comprehensive' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setPreferences(prev => ({ ...prev, coverage_priority: option.value }))}
                  className={`p-4 rounded-2xl border-2 text-center transition ${
                    preferences.coverage_priority === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="font-bold">{option.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Maximum Annual Budget (₹)
            </label>
            <input
              type="number"
              name="max_budget"
              value={preferences.max_budget}
              onChange={handleChange}
              placeholder="e.g., 50000"
              className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Interested Policy Types
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['auto', 'health', 'life', 'home', 'travel'].map(type => (
                <button
                  key={type}
                  onClick={() => handlePolicyTypeToggle(type)}
                  className={`p-4 rounded-2xl border-2 capitalize transition ${
                    preferences.preferred_policy_types.includes(type)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
        {step > 1 && (
          <button
            onClick={prevStep}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
          >
            ← Previous
          </button>
        )}
        <div className="flex gap-3 ml-auto">
          {step < 4 ? (
            <button
              onClick={nextStep}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={savePreferences}
              disabled={loading}
              className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Get Recommendations'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreferencesWizard;