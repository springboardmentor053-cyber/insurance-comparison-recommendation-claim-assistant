import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { preferencesAPI, recommendationsAPI } from '../api';
import { Settings, Save, AlertCircle } from 'lucide-react';

const ProfilePreferences = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    age: 30,
    annual_income: 60000,
    family_size: 1,
    health_status: 'good',
    vehicle_type: 'basic',
    preferred_coverage: 100000,
    max_monthly_budget: 200,
    risk_tolerance: 'medium'
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await preferencesAPI.get();
        if (res.data) {
          // Merge to ensure defaults are intact
          setFormData(prev => ({ ...prev, ...res.data }));
        }
      } catch (err) {
        // If 404 (preferences not found), we just stick with defaults.
        if (err.response?.status !== 404) {
          console.error("Failed to load preferences:", err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Save preferences
      await preferencesAPI.update(formData);
      
      // Auto-refresh recommendations in the backend using the new profile!
      await recommendationsAPI.generate().catch(() => {});
      
      // Send user securely back to Dashboard to see their new Matches
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update preferences.');
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center p-10 text-xl">Loading profile data...</div>;

  return (
    <div className="max-w-3xl mx-auto py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-3">
          <Settings className="text-primary" size={32} /> 
          <span className="gradient-text">Preferences</span>
        </h1>
        <p className="text-muted">Tell us about yourself so our experts can hand-pick exactly what you need.</p>
      </div>

      <div className="glass p-8">
        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3">
            <AlertCircle size={20}/> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 form-grid animation-fade-in">
          <h2 className="col-span-1 md:col-span-2 text-xl font-bold border-b border-[var(--border)] pb-2 text-primary-glow">Personal Details</h2>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted">Age</label>
            <input name="age" type="number" value={formData.age} onChange={handleChange} required min="18" max="100" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted">Family Size</label>
            <input name="family_size" type="number" value={formData.family_size} onChange={handleChange} required min="1" max="15" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted">Health Status</label>
            <select name="health_status" value={formData.health_status} onChange={handleChange}>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted">Primary Vehicle</label>
            <select name="vehicle_type" value={formData.vehicle_type} onChange={handleChange}>
              <option value="none">No Vehicle</option>
              <option value="basic">Basic / Commuter</option>
              <option value="premium">Premium / Luxury</option>
            </select>
          </div>

          <h2 className="col-span-1 md:col-span-2 text-xl font-bold border-b border-[var(--border)] pb-2 mt-4 text-emerald-400">Financial Profile</h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted">Annual Income ($)</label>
            <input name="annual_income" type="number" value={formData.annual_income} onChange={handleChange} required min="0" step="1000" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted">Max Monthly Budget ($)</label>
            <input name="max_monthly_budget" type="number" value={formData.max_monthly_budget} onChange={handleChange} required min="0" step="10" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted">Preferred Total Coverage ($)</label>
            <input name="preferred_coverage" type="number" value={formData.preferred_coverage} onChange={handleChange} required min="0" step="10000" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-muted">Risk Tolerance</label>
            <select name="risk_tolerance" value={formData.risk_tolerance} onChange={handleChange}>
              <option value="low">Low (High Coverage, High Premium)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Low Coverage, Low Premium)</option>
            </select>
          </div>

          <div className="col-span-1 md:col-span-2 pt-6 flex justify-end gap-4">
            <button type="button" onClick={() => navigate('/dashboard')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-8 shadow-[0_0_20px_rgba(99,102,241,0.4)]" disabled={saving}>
              {saving ? 'Analyzing...' : <><Save size={18} className="inline mr-2" /> Match Policies</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePreferences;
