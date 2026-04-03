import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { claimsAPI, policyAPI } from '../api';
import { Check, ClipboardList, ShieldAlert, Sparkles, AlertTriangle } from 'lucide-react';

const steps = [
  { id: 1, title: 'Select Policy', icon: ShieldAlert },
  { id: 2, title: 'Claim Details', icon: ClipboardList },
  { id: 3, title: 'Review & Finish', icon: Sparkles }
];

const ClaimWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    policy_id: '',
    claim_type: 'medical',
    claim_amount: '',
    incident_date: new Date().toISOString().split('T')[0],
    description: ''
  });
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await policyAPI.getPolicies();
        setPolicies(res.data);
        if (res.data.length > 0) {
          setFormData(prev => ({ ...prev, policy_id: res.data[0].id }));
        }
      } catch (err) {
        console.error('Failed to load policies', err);
      }
    };
    fetchPolicies();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      // Format date for FastAPI datetime validator
      const submissionData = { ...formData };
      if (submissionData.incident_date && !submissionData.incident_date.includes('T')) {
        submissionData.incident_date = `${submissionData.incident_date}T00:00:00.000Z`;
      }
      
      // 1. Create claim (Draft)
      const claimRes = await claimsAPI.fileClaim(submissionData);
      
      // 2. Submit Claim natively for processing
      const submitRes = await claimsAPI.submitClaim(claimRes.data.id);
      
      setSuccess({
        message: submitRes.data.message,
        claimNumber: submitRes.data.claim_number,
        risk: submitRes.data.fraud_check?.risk_level
      });
      setCurrentStep(4); // Success step
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        // Handle FastAPI validation error array
        setError(detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join(', '));
      } else {
        setError(detail || 'Failed to submit claim.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">File a <span className="gradient-text">New Claim</span></h1>
        <p className="text-muted">Fast, secure, and straightforward.</p>
      </div>

      {currentStep < 4 && (
        <div className="relative mb-12 flex justify-between">
          <div className="absolute top-6 left-16 right-16 h-1 bg-[var(--border)] -translate-y-1/2 z-0 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
          
          {steps.map(step => (
            <div key={step.id} className="relative z-10 flex flex-col items-center w-32">
              <div className={`w-12 h-12 flex items-center justify-center rounded-full border-4 transition-all duration-500 ${
                currentStep > step.id ? 'bg-primary border-primary text-white' : 
                currentStep === step.id ? 'bg-background border-primary text-primary shadow-[0_0_15px_rgba(37,99,235,0.4)] scale-110' : 
                'bg-background border-[var(--border)] text-muted'
              }`}>
                {currentStep > step.id ? <Check size={20} /> : <step.icon size={20} />}
              </div>
              <span className={`mt-3 text-sm font-bold text-center transition-colors duration-300 ${currentStep >= step.id ? 'text-primary' : 'text-muted'}`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="glass p-8">
        {error && <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3"><AlertTriangle size={20}/> {error}</div>}
        
        {currentStep === 1 && (
          <div className="space-y-6 animation-fade-in">
            <h2 className="text-xl font-bold border-b border-[var(--border)] pb-4">Select Target Policy</h2>
            
            <div className="flex flex-col gap-2 max-w-xl">
              <label className="text-sm font-medium text-muted">Which policy are you claiming against?</label>
              {policies.length === 0 ? (
                <p className="text-red-400 p-4 border border-red-500/30 bg-red-500/10 rounded-lg">
                  No active policies found in the system.
                </p>
              ) : (
                <select 
                  name="policy_id" 
                  value={formData.policy_id} 
                  onChange={handleChange}
                  className="w-full text-lg p-3"
                >
                  {policies.map(policy => (
                    <option key={policy.id} value={policy.id}>
                      {policy.name} ({policy.type.toUpperCase()}) - ${policy.coverage_amount.toLocaleString()} Coverage
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <button 
                onClick={nextStep} 
                className="btn btn-primary"
                disabled={!formData.policy_id}
              >
                Proceed to Details
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animation-fade-in">
            <h2 className="text-xl font-bold border-b border-[var(--border)] pb-4">Incident Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted">Claim Type</label>
                <select name="claim_type" value={formData.claim_type} onChange={handleChange}>
                  <option value="medical">Medical</option>
                  <option value="auto">Auto</option>
                  <option value="home">Home</option>
                  <option value="travel">Travel</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted">Claim Amount ($)</label>
                <input 
                  type="number" 
                  name="claim_amount" 
                  value={formData.claim_amount} 
                  onChange={handleChange}
                  placeholder="e.g. 1500"
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="text-sm text-muted">Incident Date</label>
                <input 
                  type="date" 
                  name="incident_date" 
                  value={formData.incident_date} 
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm text-muted">Detailed Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange}
                rows={4}
                placeholder="Please describe exactly what happened..."
              />
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="btn btn-secondary">Back</button>
              <button 
                onClick={nextStep} 
                className="btn btn-primary"
                disabled={!formData.claim_amount || !formData.description}
              >
                Review Summary
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animation-fade-in">
            <h2 className="text-xl font-bold border-b border-[var(--border)] pb-4">Review Your Claim</h2>
            
            <div className="bg-[rgba(255,255,255,0.02)] p-6 rounded-lg border border-[var(--border)] grid grid-cols-2 gap-y-4">
              <div>
                <span className="text-sm text-muted block mb-1">Target Policy ID</span>
                <span className="font-medium text-lg text-primary-glow">{formData.policy_id}</span>
              </div>
              <div>
                <span className="text-sm text-muted block mb-1">Claim Type</span>
                <span className="font-medium text-lg uppercase">{formData.claim_type}</span>
              </div>
              <div>
                <span className="text-sm text-muted block mb-1">Claimed Amount</span>
                <span className="font-medium text-xl text-emerald-400">${parseFloat(formData.claim_amount).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-sm text-muted block mb-1">Incident Date</span>
                <span className="font-medium text-lg">{formData.incident_date}</span>
              </div>
              <div className="col-span-2 mt-2">
                <span className="text-sm text-muted block mb-2">Description</span>
                <p className="bg-[var(--background)] p-3 rounded text-sm whitespace-pre-wrap font-mono">
                  {formData.description}
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={prevStep} className="btn btn-secondary" disabled={loading}>Refine Details</button>
              <button onClick={handleSubmit} className="btn btn-primary bg-emerald-500 hover:bg-emerald-400 border-none px-8" disabled={loading}>
                {loading ? 'Processing...' : 'Submit Claim Legally'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 4 && success && (
          <div className="text-center py-10 animation-fade-in">
            <div className="mx-auto w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Check size={48} />
            </div>
            <h2 className="text-3xl font-bold mb-4">{success.message}</h2>
            <p className="text-xl text-muted mb-8">
              Your claim tracking number is <span className="text-primary-glow font-mono font-bold tracking-widest">{success.claimNumber}</span>
            </p>
            {success.risk === 'high' && (
              <div className="mt-4 mb-8 inline-block bg-orange-500/20 border border-orange-500/50 text-orange-400 px-4 py-2 rounded-lg text-sm">
                Note: This claim has been flagged for additional manual review based on our risk assessment algorithms.
              </div>
            )}
            <div>
              <button onClick={() => navigate('/dashboard')} className="btn btn-primary px-8">
                Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimWizard;
