import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyPolicies } from '../services/policyService';
import { createClaim, uploadClaimDocument, submitClaim } from '../services/claimService';

const DOC_TYPE_OPTIONS = [
    { value: 'accident_photo', label: 'Accident Photo' },
    { value: 'medical_bill', label: 'Medical Bill' },
    { value: 'repair_bill', label: 'Repair Bill' },
    { value: 'police_report', label: 'Police Report / FIR' },
    { value: 'hospital_discharge', label: 'Hospital Discharge Summary' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'identity_proof', label: 'Identity Proof' },
    { value: 'other', label: 'Other' },
];

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function ClaimFilingWizard() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        user_policy_id: '',
        claim_type: 'medical',
        incident_date: '',
        amount_claimed: '',
    });

    // Files now store { file, docType, preview }
    const [files, setFiles] = useState([]);

    useEffect(() => {
        getMyPolicies()
            .then(data => setPolicies(data.filter(p => p.status === 'active')))
            .catch(() => setPolicies([]))
            .finally(() => setLoading(false));
    }, []);

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        if (files.length + selected.length > 5) {
            setError('Maximum 5 files allowed');
            return;
        }

        // Validate each file
        for (const f of selected) {
            if (!ALLOWED_TYPES.includes(f.type)) {
                setError(`Invalid format: ${f.name}. Only JPEG, PNG, and PDF are allowed.`);
                return;
            }
            if (f.size > MAX_FILE_SIZE) {
                setError(`File too large: ${f.name}. Maximum size is 10MB.`);
                return;
            }
        }

        setError('');
        const newFiles = selected.map(f => ({
            file: f,
            docType: 'other',
            preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
        }));
        setFiles(prev => [...prev, ...newFiles]);
        e.target.value = ''; // reset input
    };

    const updateDocType = (index, docType) => {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, docType } : f));
    };

    const removeFile = (index) => {
        setFiles(prev => {
            // Revoke preview URL to avoid memory leaks
            if (prev[index].preview) URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');

        try {
            // 1. Create the Claim (draft)
            const payload = {
                user_policy_id: Number(formData.user_policy_id),
                claim_type: formData.claim_type,
                incident_date: formData.incident_date,
                amount_claimed: Number(formData.amount_claimed),
            };
            const claim = await createClaim(payload);

            // 2. Upload all documents with their doc_type
            for (const item of files) {
                await uploadClaimDocument(claim.id, item.file, item.docType);
            }

            // 3. Final submission (validates required doc types)
            try {
                await submitClaim(claim.id);
            } catch (submitErr) {
                // If submission fails due to missing docs, still navigate to claim details
                // so the user can see what's missing and add more docs
                navigate(`/claims/${claim.id}`);
                return;
            }

            // 4. Redirect to the newly submitted claim
            navigate(`/claims/${claim.id}`);
            
        } catch (err) {
            setError(err?.response?.data?.detail || '❌ Failed to submit claim. Please check all fields.');
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="page-wrapper">
                <div style={{ display: 'flex', justifyContent: 'center', padding: '10rem 0' }}>
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    const inputStyle = {
        width: '100%', padding: '0.875rem 1rem',
        background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: '0.5rem', color: 'white', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div className="page-wrapper">
            <div className="page-content" style={{ maxWidth: '640px', margin: '0 auto' }}>
                
                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/claims')}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#818cf8', fontSize: '0.875rem', fontWeight: 500,
                            margin: '0 auto 1rem auto', display: 'flex', alignItems: 'center', gap: '0.375rem',
                        }}
                    >
                        ← Back to Claims
                    </button>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        File a <span className="gradient-text">New Claim</span>
                    </h1>
                    
                    {/* Step Indicator */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                        {[1, 2, 3].map(s => (
                            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{
                                    width: '28px', height: '28px', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.75rem', fontWeight: 700,
                                    background: step >= s ? '#818cf8' : 'rgba(148,163,184,0.15)',
                                    color: step >= s ? 'white' : '#64748b',
                                    transition: 'all 0.3s',
                                }}>{s}</div>
                                {s < 3 && <div style={{ width: '40px', height: '2px', background: step > s ? '#818cf8' : 'rgba(148,163,184,0.15)', transition: 'all 0.3s' }} />}
                            </div>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="animate-fade-in-up" style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '0.75rem', padding: '1rem', color: '#fca5a5',
                        fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center'
                    }}>{error}</div>
                )}

                <div className="glass-card animate-fade-in-up" style={{ padding: '2rem' }}>
                    
                    {/* ═══ STEP 1: SELECT POLICY ═══ */}
                    {step === 1 && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Select Policy</h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                Which active policy are you claiming against?
                            </p>

                            {policies.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(239,68,68,0.05)', borderRadius: '0.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <p style={{ color: '#fca5a5' }}>You don't have any active policies to file a claim against.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {policies.map(p => (
                                        <div 
                                            key={p.id}
                                            onClick={() => setFormData({ ...formData, user_policy_id: p.id })}
                                            style={{
                                                padding: '1rem', borderRadius: '0.5rem', cursor: 'pointer',
                                                border: formData.user_policy_id === p.id 
                                                    ? '2px solid #818cf8' 
                                                    : '2px solid rgba(148,163,184,0.1)',
                                                background: formData.user_policy_id === p.id 
                                                    ? 'rgba(99,102,241,0.1)' 
                                                    : 'rgba(15,23,42,0.4)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <p style={{ fontWeight: 600, color: 'white' }}>{p.policy?.title}</p>
                                            <p style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>#{p.policy_number} · {p.policy?.provider?.name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                                <button onClick={handleNext} className="btn-primary" disabled={!formData.user_policy_id}>
                                    Next Step →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ═══ STEP 2: INCIDENT DETAILS ═══ */}
                    {step === 2 && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Incident Details</h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                Tell us about what happened.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                        Type of Claim
                                    </label>
                                    <select
                                        value={formData.claim_type}
                                        onChange={(e) => setFormData({ ...formData, claim_type: e.target.value })}
                                        style={inputStyle}
                                    >
                                        <option value="medical">Medical / Hospitalization</option>
                                        <option value="accident">Accident</option>
                                        <option value="theft">Theft / Burglary</option>
                                        <option value="damage">Property/Vehicle Damage</option>
                                        <option value="death">Death</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                        Date of Incident
                                    </label>
                                    <input
                                        type="date"
                                        max={new Date().toISOString().split('T')[0]}
                                        value={formData.incident_date}
                                        onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                        Amount Claimed (₹)
                                    </label>
                                    <input
                                        type="number" min="1" placeholder="e.g. 50000"
                                        value={formData.amount_claimed}
                                        onChange={(e) => setFormData({ ...formData, amount_claimed: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                                <button onClick={handlePrev} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                    ← Back
                                </button>
                                <button onClick={handleNext} className="btn-primary" disabled={!formData.claim_type || !formData.incident_date || !formData.amount_claimed}>
                                    Next Step →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ═══ STEP 3: DOCUMENTS WITH DOC_TYPE ═══ */}
                    {step === 3 && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Supporting Documents</h2>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                                Upload receipts, bills, FIR copies, or photos. Assign a category to each document. (Max 5 files, ≤10MB each)
                            </p>

                            {/* Drop zone */}
                            <div style={{ border: '2px dashed rgba(99,102,241,0.3)', borderRadius: '0.5rem', padding: '1.5rem', textAlign: 'center', background: 'rgba(99,102,241,0.02)', marginBottom: '1.5rem' }}>
                                <input type="file" id="file-upload" multiple accept="image/jpeg,image/png,application/pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                                    <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0' }}>📄</p>
                                    <p style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'underline' }}>Click to browse files</p>
                                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.5rem' }}>JPG, PNG, or PDF up to 10MB</p>
                                </label>
                            </div>

                            {/* File list with doc_type selector and preview */}
                            {files.length > 0 && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                    {files.map((item, i) => (
                                        <div key={i} style={{
                                            background: 'rgba(15,23,42,0.6)', padding: '0.875rem 1rem',
                                            borderRadius: '0.5rem', border: '1px solid rgba(148,163,184,0.1)',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {/* Preview thumbnail */}
                                                {item.preview ? (
                                                    <img src={item.preview} alt="" style={{
                                                        width: '48px', height: '48px', borderRadius: '0.375rem',
                                                        objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(148,163,184,0.2)',
                                                    }} />
                                                ) : (
                                                    <div style={{
                                                        width: '48px', height: '48px', borderRadius: '0.375rem',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        background: 'rgba(239,68,68,0.1)', fontSize: '1.25rem', flexShrink: 0,
                                                    }}>📄</div>
                                                )}

                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: '0.8125rem', color: '#e2e8f0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {item.file.name}
                                                    </p>
                                                    <p style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                                                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>

                                                <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 800, fontSize: '1.125rem', flexShrink: 0 }}>
                                                    ×
                                                </button>
                                            </div>

                                            {/* Doc type selector */}
                                            <select
                                                value={item.docType}
                                                onChange={(e) => updateDocType(i, e.target.value)}
                                                style={{
                                                    marginTop: '0.625rem', width: '100%', padding: '0.5rem 0.75rem',
                                                    background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)',
                                                    borderRadius: '0.375rem', color: '#94a3b8', fontSize: '0.8125rem', outline: 'none',
                                                }}
                                            >
                                                {DOC_TYPE_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button onClick={handlePrev} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
                                    ← Back
                                </button>
                                <button 
                                    onClick={handleSubmit} 
                                    className="btn-primary" 
                                    style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 14px rgba(16,185,129,0.3)' }}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Submitting...' : '✓ Submit Claim'}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
