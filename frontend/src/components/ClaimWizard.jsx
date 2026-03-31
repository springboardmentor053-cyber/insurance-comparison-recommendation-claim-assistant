
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import client from '../api/client';

const STEPS = ['Policy', 'Incident Details', 'Upload Docs', 'Review', 'Submit'];

// Extra fields shown per policy type
const POLICY_EXTRA_FIELDS = {
    health: [
        { name: 'hospital_name', label: 'Hospital Name', type: 'text' },
    ],
    auto: [
        { name: 'incident_location', label: 'Accident Location', type: 'text' },
        { name: 'third_party_involved', label: 'Third Party Involved?', type: 'select', options: ['yes', 'no'] },
        { name: 'police_report_number', label: 'Police Report Number', type: 'text' },
        { name: 'repair_estimate', label: 'Repair Estimate (₹)', type: 'number' },
    ],
    home: [
        { name: 'incident_location', label: 'Property Address', type: 'text' },
        { name: 'cause', label: 'Damage Type (fire/flood/theft)', type: 'text' },
        { name: 'repair_estimate', label: 'Estimated Repair Cost (₹)', type: 'number' },
    ],
    life: [
        { name: 'beneficiary_name', label: 'Beneficiary Name', type: 'text' },
        { name: 'beneficiary_relation', label: 'Relation to Beneficiary', type: 'text' },
        { name: 'cause', label: 'Cause', type: 'text' },
    ],
    travel: [
        { name: 'trip_destination', label: 'Trip Destination', type: 'text' },
        { name: 'cause', label: 'Reason (medical/lost baggage/flight cancel)', type: 'text' },
    ],
};

const DOC_TYPES = ['accident_photo', 'repair_invoice', 'police_report', 'medical_report', 'other'];

const SUGGESTED_DOCS = {
    auto: ['accident_photo', 'police_report'],
    health: ['medical_report'],
    home: ['repair_invoice', 'accident_photo'],
    life: [],
    travel: []
};


const ClaimWizard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const passedState = location.state || {};

    const [step, setStep] = useState(passedState.user_policy_id ? 2 : 1);
    const [claimId, setClaimId] = useState(id || null);
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const [form, setForm] = useState({
        user_policy_id: passedState.user_policy_id || '',
        policy_type: passedState.policy_type || 'health',
        policy_title: passedState.policy_title || '',
        claim_type: passedState.policy_type || 'health',
        incident_date: '',
        incident_description: '',
        amount_claimed: '',
        // Optional
        incident_location: '',
        third_party_involved: '',
        police_report_number: '',
        hospital_name: '',
        repair_estimate: '',
        beneficiary_name: '',
        beneficiary_relation: '',
        cause: '',
        trip_destination: '',
    });

    const [docFile, setDocFile] = useState(null);
    const [docType, setDocType] = useState('accident_photo');
    const [pendingFiles, setPendingFiles] = useState([]);

    const extraFields = POLICY_EXTRA_FIELDS[form.claim_type] || [];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (id) {
            client.get(`/claims/${id}`)
                .then(res => {
                    const claim = res.data;
                    setForm(prev => ({
                        ...prev,
                        user_policy_id: claim.user_policy_id,
                        claim_type: claim.claim_type,
                        incident_date: claim.incident_date || '',
                        incident_description: claim.incident_description || '',
                        amount_claimed: claim.amount_claimed || '',
                        incident_location: claim.incident_location || '',
                        third_party_involved: claim.third_party_involved || '',
                        police_report_number: claim.police_report_number || '',
                        hospital_name: claim.hospital_name || '',
                        repair_estimate: claim.repair_estimate || '',
                        beneficiary_name: claim.beneficiary_name || '',
                        beneficiary_relation: claim.beneficiary_relation || '',
                        cause: claim.cause || '',
                        trip_destination: claim.trip_destination || '',
                    }));
                    // Go to Step 2 if fields are missing, else Step 3
                    setStep(2);
                })
                .catch(e => setError("Failed to load claim data."));

            client.get(`/claims/${id}/documents`)
                .then(res => setDocuments(res.data))
                .catch(console.error);
        }
    }, [id]);

    // Step 2 → 3: Create the draft claim
    const handleCreateClaim = async () => {
        setError('');
        if (!form.incident_date || !form.incident_description || !form.amount_claimed) {
            setError('Please fill all required fields.');
            return;
        }
        try {
            const payload = {
                user_policy_id: Number(form.user_policy_id),
                claim_type: form.claim_type,
                incident_date: form.incident_date,
                incident_description: form.incident_description,
                amount_claimed: parseFloat(form.amount_claimed),
                incident_location: form.incident_location || null,
                third_party_involved: form.third_party_involved || null,
                police_report_number: form.police_report_number || null,
                hospital_name: form.hospital_name || null,
                repair_estimate: form.repair_estimate ? parseFloat(form.repair_estimate) : null,
                beneficiary_name: form.beneficiary_name || null,
                beneficiary_relation: form.beneficiary_relation || null,
                cause: form.cause || null,
                trip_destination: form.trip_destination || null,
            };
            if (claimId) {
                // Update existing claim
                await client.put(`/claims/${claimId}`, payload);
                setStep(3);
            } else {
                // Create new claim
                const res = await client.post('/claims/', payload);
                if (res.data && res.data.id) {
                    setClaimId(res.data.id);
                    setStep(3);
                } else {
                    setError('Claim creation failed: Server did not return a valid Claim ID.');
                }
            }
        } catch (e) {
            setError(e.response?.data?.detail || 'Error saving claim.');
        }
    };

    const handleAddPending = () => {
        if (!docFile) return;
        setPendingFiles(prev => [...prev, { file: docFile, type: docType }]);
        setDocFile(null);
        // Reset the file input visually
        const fileInput = document.getElementById('claimFileInput');
        if (fileInput) fileInput.value = '';
    };

    const handleRemovePending = (index) => {
        setPendingFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUploadAll = async () => {
        if (pendingFiles.length === 0) return;
        if (!claimId) {
            setError('System Error: Missing Claim ID. Please try reloading the page or saving your details again.');
            return;
        }
        setUploading(true);
        setError('');
        try {
            const uploadPromises = pendingFiles.map(async (fileObj) => {
                const fd = new FormData();
                fd.append('file', fileObj.file);
                fd.append('doc_type', fileObj.type);
                const res = await client.post(`/claims/${claimId}/documents`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                return res.data;
            });
            const newDocs = await Promise.all(uploadPromises);
            setDocuments(prev => [...prev, ...newDocs]);
            setPendingFiles([]);
        } catch (e) {
            setError(e.response?.data?.detail || 'One or more uploads failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDoc = async (docId) => {
        if (!claimId) return;
        if (!window.confirm('Are you sure you want to delete this document?')) return;
        setError('');
        try {
            await client.delete(`/claims/${claimId}/documents/${docId}`);
            setDocuments(prev => prev.filter(d => d.id !== docId));
        } catch (e) {
            setError(e.response?.data?.detail || 'Failed to delete document.');
        }
    };

    const handleSubmit = async () => {
        if (!claimId) {
            setError('Valid Claim ID missing. Cannot submit.');
            return;
        }
        if (documents.length === 0) {
            setError('Please upload at least one document before submitting.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await client.post(`/claims/${claimId}/submit`);
            navigate('/claims/my', { state: { successMessage: res.data.message, claimNumber: res.data.claim_number } });
        } catch (e) {
            setError(e.response?.data?.detail || 'Submission failed.');
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900">File a Claim</h1>
                {form.policy_title && <p className="text-sm text-gray-500 mt-1">For: <strong>{form.policy_title}</strong></p>}
                {/* Step Indicator */}
                <div className="flex items-center gap-2 mt-5">
                    {STEPS.map((s, i) => (
                        <React.Fragment key={i}>
                            <div className={`flex items-center gap-1.5 ${step === i + 1 ? 'text-indigo-600' : step > i + 1 ? 'text-green-600' : 'text-gray-300'}`}>
                                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold 
                                    ${step === i + 1 ? 'bg-indigo-600 text-white' : step > i + 1 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                    {step > i + 1 ? '✓' : i + 1}
                                </div>
                                <span className="text-xs font-medium hidden sm:block">{s}</span>
                            </div>
                            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
            )}

            {/* Step 2: Incident Details */}
            {step === 2 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    <h2 className="font-bold text-gray-800 text-lg">Incident Details</h2>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Incident Date *</label>
                        <input type="date" name="incident_date" value={form.incident_date} onChange={handleChange}
                            max={new Date().toISOString().split('T')[0]}
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Description *</label>
                        <textarea name="incident_description" value={form.incident_description} onChange={handleChange}
                            rows={3} placeholder="Describe what happened (min 20 characters)"
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Amount Claimed (₹) *</label>
                        <input type="number" name="amount_claimed" value={form.amount_claimed} onChange={handleChange}
                            placeholder="0.00" min="1"
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    </div>
                    {/* Policy-specific extra fields */}
                    {extraFields.map(field => (
                        <div key={field.name}>
                            <label className="text-sm font-medium text-gray-700">{field.label} (Optional)</label>
                            {field.type === 'select' ? (
                                <select name={field.name} value={form[field.name]} onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                                    <option value="">Select</option>
                                    {field.options.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            ) : (
                                <input type={field.type} name={field.name} value={form[field.name]} onChange={handleChange}
                                    className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                            )}
                        </div>
                    ))}
                    <div className="flex justify-between pt-2">
                        <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">← Back</button>
                        <button onClick={handleCreateClaim} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm">
                            Save & Continue →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Upload Documents */}
            {step === 3 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    <h2 className="font-bold text-gray-800 text-lg">Upload Supporting Documents</h2>
                    <div className="text-xs text-gray-500 space-y-1">
                        <p>At least 1 document required. Accepted: images, PDF (Max 10MB).</p>
                        {SUGGESTED_DOCS[form.claim_type]?.length > 0 && (
                            <p className="text-indigo-600 font-medium">
                                Suggested for {form.claim_type}: {SUGGESTED_DOCS[form.claim_type].map(t => t.replace('_', ' ')).join(', ')}
                            </p>
                        )}
                    </div>
                    <div className="space-y-3">
                        <select value={docType} onChange={e => setDocType(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                            {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <input type="file" accept="image/*,.pdf" id="claimFileInput"
                                onChange={e => setDocFile(e.target.files[0])}
                                className="flex-1 text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-2" />
                            <button onClick={handleAddPending} disabled={!docFile}
                                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm transition">
                                Add
                            </button>
                        </div>
                        {pendingFiles.length > 0 && (
                            <div className="mt-4 p-3 border border-indigo-100 bg-indigo-50 rounded-xl space-y-2">
                                <p className="text-xs font-bold text-indigo-800 uppercase">Ready to Upload ({pendingFiles.length})</p>
                                {pendingFiles.map((pf, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg shadow-sm border border-indigo-100">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded capitalize">{pf.type.replace('_', ' ')}</span>
                                            <span className="text-xs text-gray-600 truncate">{pf.file.name}</span>
                                        </div>
                                        <button onClick={() => handleRemovePending(idx)} className="text-red-500 hover:text-red-700 w-6 h-6 flex items-center justify-center font-bold">✕</button>
                                    </div>
                                ))}
                                <button onClick={handleUploadAll} disabled={uploading}
                                    className="w-full mt-2 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm transition shadow">
                                    {uploading ? 'Uploading...' : `Upload All ${pendingFiles.length} Document(s)`}
                                </button>
                            </div>
                        )}
                    </div>
                    {documents.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-500 uppercase">Uploaded ({documents.length})</p>
                            {documents.map(d => {
                                const isImage = !d.file_url.toLowerCase().includes('.pdf');
                                return (
                                <div key={d.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                    <div className="flex items-center gap-3 flex-1">
                                        {isImage ? (
                                            <img src={d.file_url} alt={d.doc_type} className="w-10 h-10 object-cover rounded shadow-sm border border-green-200" />
                                        ) : (
                                            <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded text-xs font-bold text-gray-500">PDF</div>
                                        )}
                                        <span className="text-xs text-green-700 font-medium capitalize">{d.doc_type.replace('_', ' ')}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <a href={d.file_url} target="_blank" rel="noreferrer"
                                            className="text-xs text-indigo-600 font-medium hover:underline">View ↗</a>
                                        <button onClick={() => handleDeleteDoc(d.id)} className="text-red-500 hover:text-red-700 focus:outline-none">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )})}
                        </div>
                    )}
                    <div className="flex justify-between pt-2">
                        <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">← Back</button>
                        <button onClick={() => setStep(4)} disabled={documents.length === 0 || pendingFiles.length > 0}
                            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm">
                            Review →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                    <h2 className="font-bold text-gray-800 text-lg">Review Your Claim</h2>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Policy Type</span><span className="font-medium capitalize">{form.claim_type}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Incident Date</span><span className="font-medium">{form.incident_date}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Amount Claimed</span><span className="font-bold text-gray-900">₹{form.amount_claimed}</span></div>
                        <div className="pt-2 border-t border-gray-200"><span className="text-gray-500 block mb-1">Description</span><p className="text-gray-800 text-xs">{form.incident_description}</p></div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Documents ({documents.length})</p>
                        {documents.map(d => {
                            const isImage = !d.file_url.toLowerCase().includes('.pdf');
                            return (
                            <div key={d.id} className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2 mb-1">
                                <div className="flex items-center gap-3">
                                    {isImage ? (
                                        <a href={d.file_url} target="_blank" rel="noreferrer">
                                            <img src={d.file_url} alt={d.doc_type} className="w-12 h-12 object-cover rounded shadow-sm hover:opacity-80 transition cursor-pointer" />
                                        </a>
                                    ) : (
                                        <div className="w-12 h-12 flex items-center justify-center bg-indigo-200 rounded text-xs font-bold text-indigo-700">PDF</div>
                                    )}
                                    <span className="text-xs text-indigo-700 font-medium capitalize">{d.doc_type.replace('_', ' ')}</span>
                                </div>
                                <a href={d.file_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-500 hover:underline">View ↗</a>
                            </div>
                        )})}
                    </div>
                    <div className="flex justify-between pt-2">
                        <button onClick={() => setStep(3)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">← Edit</button>
                        <button onClick={() => setStep(5)} className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 text-sm">
                            Submit Claim →
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Final Submit */}
            {step === 5 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center space-y-4">
                    <div className="text-5xl">📋</div>
                    <h2 className="font-bold text-gray-800 text-lg">Ready to Submit?</h2>
                    <p className="text-gray-500 text-sm">Once submitted, you cannot edit this claim. Our team will review it shortly.</p>
                    <div className="flex justify-between pt-2">
                        <button onClick={() => setStep(4)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">← Back</button>
                        <button onClick={handleSubmit} disabled={submitting}
                            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl disabled:opacity-50 transition">
                            {submitting ? 'Submitting...' : '🚀 Submit Claim'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClaimWizard;
