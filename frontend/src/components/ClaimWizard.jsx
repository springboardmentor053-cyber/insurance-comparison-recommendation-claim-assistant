import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const ClaimWizard = ({ onComplete, onCancel }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [userPolicies, setUserPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimId, setClaimId] = useState(null);
  const [formData, setFormData] = useState({
    user_policy_id: '',
    claim_type: 'accident',
    incident_date: '',
    description: '',
    amount_claimed: ''
  });

  // Document upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Fetch user's active policies
  useEffect(() => {
    setLoading(true);
    API.get('/claims/user-policies')
      .then(res => {
        setUserPolicies(res.data);
        // Pre-select policy if coming from "File Claim" button
        const storedPolicyId = localStorage.getItem('claimPolicyId');
        if (storedPolicyId) {
          const policyExists = res.data.some(p => p.id == storedPolicyId);
          if (policyExists) {
            setFormData(prev => ({ ...prev, user_policy_id: parseInt(storedPolicyId) }));
          }
          localStorage.removeItem('claimPolicyId');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch policies', err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const createDraftClaim = async () => {
    try {
      const res = await API.post('/claims', formData);
      return res.data;
    } catch (err) {
      console.error(err);
      alert('Failed to create claim draft');
    }
  };

  const handleSubmitStep1 = async () => {
    if (!formData.user_policy_id) {
      alert('Please select a policy');
      return;
    }
    nextStep();
  };

  const handleSubmitStep2 = async () => {
    if (!formData.incident_date || !formData.amount_claimed) {
      alert('Please fill all fields');
      return;
    }
    const claim = await createDraftClaim();
    if (claim) {
      setClaimId(claim.id);
      nextStep(); // go to step 3 (documents)
    }
  };

  // File upload handling
  const onFileSelect = (e) => {
    setSelectedFiles([...e.target.files]);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    try {
      const res = await API.post(`/claims/${claimId}/documents/multiple`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadedFiles(res.data);
      alert('Files uploaded successfully');
      nextStep(); // go to step 4 (review)
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submitClaim = async () => {
    try {
      await API.put(`/claims/${claimId}/submit`);
      nextStep(); // go to step 5 (confirmation)
    } catch (err) {
      console.error(err);
      alert('Failed to submit claim');
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    else navigate('/');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900">File a Claim</h2>
        <p className="text-slate-400 text-sm">Step {step} of 5</p>
        <div className="w-full h-2 bg-slate-100 rounded-full mt-2">
          <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${(step/5)*100}%` }}></div>
        </div>
      </div>

      {/* Step 1: Policy Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-700">Select Policy</h3>
          {userPolicies.length === 0 ? (
            <p className="text-center text-slate-400 py-8">You don't have any active policies to file a claim against.</p>
          ) : (
            <div className="space-y-3">
              {userPolicies.map(policy => (
                <label key={policy.id} className={`block p-4 border-2 rounded-xl cursor-pointer transition ${
                  formData.user_policy_id == policy.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="radio"
                    name="user_policy_id"
                    value={policy.id}
                    checked={formData.user_policy_id == policy.id}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <div className="flex justify-between">
                    <div>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full uppercase">
                        {policy.policy.policy_type}
                      </span>
                      <h4 className="font-black mt-2">{policy.policy.title}</h4>
                      <p className="text-sm text-slate-400">{policy.policy.provider_name}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Policy #</div>
                      <div className="font-mono text-sm">{policy.policy_number}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end gap-3 mt-8">
            <button onClick={handleCancel} className="px-6 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
            <button 
              onClick={handleSubmitStep1} 
              disabled={userPolicies.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Incident Details */}
      {step === 2 && (
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-700">Incident Details</h3>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Claim Type</label>
            <select
              name="claim_type"
              value={formData.claim_type}
              onChange={handleChange}
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"
            >
              <option value="accident">Accident</option>
              <option value="theft">Theft</option>
              <option value="damage">Damage</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Incident Date</label>
            <input
              type="date"
              name="incident_date"
              value={formData.incident_date}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Describe what happened..."
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Claim Amount (₹)</label>
            <input
              type="number"
              name="amount_claimed"
              value={formData.amount_claimed}
              onChange={handleChange}
              placeholder="e.g., 40000"
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>
          <div className="flex justify-between gap-3 mt-8">
            <button onClick={prevStep} className="px-6 py-3 bg-slate-100 rounded-xl font-bold">← Previous</button>
            <button onClick={handleSubmitStep2} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold">Next: Upload Documents →</button>
          </div>
        </div>
      )}

      {/* Step 3: Upload Documents */}
      {step === 3 && (
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-700">Upload Documents</h3>
          <p className="text-sm text-slate-500">Upload photos, repair bills, police reports, etc. (JPEG, PNG, PDF)</p>
          
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,application/pdf"
              onChange={onFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="text-4xl mb-2">📎</div>
              <p className="text-blue-600 font-bold">Click to select files</p>
              <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="font-bold text-slate-700 mb-2">Selected files:</h4>
              <ul className="list-disc list-inside text-sm text-slate-600">
                {Array.from(selectedFiles).map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl">
              <p className="text-green-600 font-bold">✓ {uploadedFiles.length} files uploaded</p>
            </div>
          )}

          <div className="flex justify-between gap-3 mt-8">
            <button onClick={prevStep} className="px-6 py-3 bg-slate-100 rounded-xl font-bold">← Previous</button>
            <button
              onClick={uploadFiles}
              disabled={selectedFiles.length === 0 || uploading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <div className="space-y-6">
          <h3 className="text-lg font-black text-slate-700">Review Your Claim</h3>
          
          <div className="bg-slate-50 p-4 rounded-xl space-y-2">
            <p><span className="font-bold">Policy:</span> {userPolicies.find(p => p.id == formData.user_policy_id)?.policy.title}</p>
            <p><span className="font-bold">Claim Type:</span> {formData.claim_type}</p>
            <p><span className="font-bold">Incident Date:</span> {formData.incident_date}</p>
            <p><span className="font-bold">Amount:</span> ₹{formData.amount_claimed}</p>
            <p><span className="font-bold">Description:</span> {formData.description}</p>
            <p><span className="font-bold">Documents:</span> {uploadedFiles.length} file(s) uploaded</p>
          </div>

          <div className="flex justify-between gap-3 mt-8">
            <button onClick={prevStep} className="px-6 py-3 bg-slate-100 rounded-xl font-bold">← Previous</button>
            <button onClick={submitClaim} className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold">
              Submit Claim
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <div className="text-center py-8 space-y-4">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-black text-green-600">Claim Submitted!</h3>
          <p className="text-slate-600">Your claim has been successfully submitted and is under review.</p>
          <p className="text-sm text-slate-400">Claim ID: {claimId}</p>
          <div className="flex justify-center gap-4 mt-6">
            <button
              onClick={() => navigate('/claims')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold"
            >
              Track Status
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-slate-100 rounded-xl font-bold"
            >
              Back to Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimWizard;