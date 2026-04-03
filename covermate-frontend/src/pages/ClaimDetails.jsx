import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClaim, uploadClaimDocument, deleteClaimDocument, updateClaim, submitClaim } from '../services/claimService';
import { API_URL } from '../services/api';

const STATUS_ORDER = ['draft', 'submitted', 'under_review', 'approved', 'paid'];
const STATUS_LABELS = {
    draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
    approved: 'Approved', paid: 'Paid', rejected: 'Rejected',
};

const DOC_TYPE_LABELS = {
    accident_photo: 'Accident Photo',
    medical_bill: 'Medical Bill',
    repair_bill: 'Repair Bill',
    police_report: 'Police Report / FIR',
    hospital_discharge: 'Hospital Discharge',
    prescription: 'Prescription',
    identity_proof: 'Identity Proof',
    other: 'Other',
};

const DOC_TYPE_OPTIONS = Object.entries(DOC_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatCurrency(amount) {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ClaimDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [claim, setClaim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [toast, setToast] = useState('');
    const [error, setError] = useState('');
    const [uploadDocType, setUploadDocType] = useState('other');

    // Editing state
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});

    // Image preview modal
    const [previewUrl, setPreviewUrl] = useState(null);

    const load = () => {
        setLoading(true);
        getClaim(id)
            .then(data => {
                setClaim(data);
                setEditForm({
                    claim_type: data.claim_type || '',
                    incident_date: data.incident_date || '',
                    amount_claimed: data.amount_claimed || '',
                });
            })
            .catch(() => navigate('/claims'))
            .finally(() => setLoading(false));
    };

    useEffect(load, [id, navigate]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    // ─── File Upload ───
    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError('Invalid file format. Only JPEG, PNG, and PDF are allowed.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setError('File too large. Maximum size is 10MB.');
            return;
        }

        setUploading(true);
        setError('');
        try {
            await uploadClaimDocument(id, file, uploadDocType);
            showToast('✅ Document uploaded');
            setUploadDocType('other');
            load();
        } catch (err) {
            setError(err?.response?.data?.detail || '❌ Failed to upload');
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    // ─── File Delete ───
    const handleDelete = async (docId) => {
        if (!window.confirm('Delete this document?')) return;
        setDeleting(docId);
        try {
            await deleteClaimDocument(docId);
            showToast('🗑️ Document deleted');
            load();
        } catch (err) {
            setError(err?.response?.data?.detail || '❌ Failed to delete');
        } finally {
            setDeleting(null);
        }
    };

    // ─── Save Edit ───
    const handleSaveEdit = async () => {
        setError('');
        try {
            await updateClaim(id, {
                claim_type: editForm.claim_type,
                incident_date: editForm.incident_date,
                amount_claimed: Number(editForm.amount_claimed),
            });
            setEditing(false);
            showToast('✅ Claim updated');
            load();
        } catch (err) {
            setError(err?.response?.data?.detail || '❌ Failed to update');
        }
    };

    // ─── Final Submit ───
    const handleFinalSubmit = async () => {
        setError('');
        try {
            await submitClaim(id);
            showToast('✅ Claim submitted for review!');
            load();
        } catch (err) {
            setError(err?.response?.data?.detail || '❌ Submission failed. Check required documents.');
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

    if (!claim) return null;

    const currentStatusIdx = STATUS_ORDER.indexOf(claim.status);
    const isRejected = claim.status === 'rejected';
    const canEdit = ['draft', 'submitted'].includes(claim.status);
    const canSubmit = claim.status === 'draft';

    const inputStyle = {
        width: '100%', padding: '0.75rem 1rem',
        background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: '0.5rem', color: 'white', outline: 'none', boxSizing: 'border-box',
    };

    return (
        <div className="page-wrapper">
            <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>

                {/* ── Image Preview Modal ── */}
                {previewUrl && (
                    <div
                        onClick={() => setPreviewUrl(null)}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 9999,
                            background: 'rgba(0,0,0,0.85)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
                        }}
                    >
                        <img src={previewUrl} alt="Preview" style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '0.5rem', boxShadow: '0 16px 48px rgba(0,0,0,0.6)' }} />
                    </div>
                )}

                {/* ── Toast & Error ── */}
                {toast && (
                    <div style={{
                        position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 9999,
                        background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(34,197,94,0.3)',
                        borderRadius: '0.75rem', padding: '1rem 1.5rem', color: 'white',
                        fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}>{toast}</div>
                )}
                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: '0.75rem', padding: '1rem', color: '#fca5a5',
                        fontSize: '0.875rem', marginBottom: '1.5rem',
                    }}>{error}</div>
                )}

                {/* ── Header ── */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate('/claims')}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#818cf8', fontSize: '0.875rem', fontWeight: 500,
                            marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                        }}
                    >
                        ← Back to Claims
                    </button>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                                Claim <span className="gradient-text">#{claim.claim_number}</span>
                            </h1>
                            <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                                Filed on {formatDate(claim.created_at)}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.125rem' }}>
                                Amount Claimed
                            </p>
                            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: '#e2e8f0' }}>
                                {formatCurrency(claim.amount_claimed)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Progress Tracker / Timeline ── */}
                <div className="glass-card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '2rem', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>
                            Claim Status
                        </h3>
                        {canSubmit && (
                            <button
                                onClick={handleFinalSubmit}
                                className="btn-primary"
                                style={{ fontSize: '0.8125rem', padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                            >
                                ✓ Submit for Review
                            </button>
                        )}
                    </div>
                    
                    {isRejected ? (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1.5rem', textAlign: 'center', color: '#fca5a5' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>❌</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 700 }}>Claim Rejected</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Your claim was not approved. Please contact support for details.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', minWidth: '500px' }}>
                            <div style={{ position: 'absolute', top: '15px', left: '10%', right: '10%', height: '3px', background: 'rgba(148,163,184,0.2)', zIndex: 0 }} />
                            <div style={{ 
                                position: 'absolute', top: '15px', left: '10%', 
                                right: `${100 - (Math.max(0, currentStatusIdx) / (STATUS_ORDER.length - 1)) * 80}%`, 
                                height: '3px', background: '#3b82f6', zIndex: 0,
                                transition: 'right 0.5s ease-out'
                            }} />

                            {STATUS_ORDER.map((s, idx) => {
                                const isCompleted = currentStatusIdx >= idx;
                                const isCurrent = currentStatusIdx === idx;
                                
                                let circleColor = 'rgba(15,23,42,1)';
                                let borderColor = 'rgba(148,163,184,0.3)';
                                let textColor = '#64748b';

                                if (isCompleted) { circleColor = '#3b82f6'; borderColor = '#3b82f6'; textColor = 'white'; }
                                if (s === 'paid' && isCompleted) { circleColor = '#10b981'; borderColor = '#10b981'; }

                                return (
                                    <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, width: '20%' }}>
                                        <div style={{ 
                                            width: '32px', height: '32px', borderRadius: '50%', 
                                            background: circleColor, border: `3px solid ${borderColor}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            marginBottom: '0.75rem', color: 'white', fontSize: '0.875rem', fontWeight: 700,
                                            boxShadow: isCurrent ? '0 0 0 4px rgba(59,130,246,0.2)' : 'none'
                                        }}>
                                            {isCompleted && s !== 'paid' ? '✓' : idx + 1}
                                        </div>
                                        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: textColor, textAlign: 'center' }}>
                                            {STATUS_LABELS[s]}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Details & Documents Grid ── */}
                <div className="animate-fade-in-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                    
                    {/* ── Left: Incident Details + Edit ── */}
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>
                                Incident Details
                            </h3>
                            {canEdit && !editing && (
                                <button
                                    onClick={() => setEditing(true)}
                                    style={{ background: 'none', border: '1px solid rgba(129,140,248,0.3)', color: '#818cf8', padding: '0.375rem 0.875rem', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600 }}
                                >
                                    ✏️ Edit
                                </button>
                            )}
                        </div>

                        {editing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.375rem' }}>Claim Type</label>
                                    <select value={editForm.claim_type} onChange={(e) => setEditForm({ ...editForm, claim_type: e.target.value })} style={inputStyle}>
                                        <option value="medical">Medical</option>
                                        <option value="accident">Accident</option>
                                        <option value="theft">Theft</option>
                                        <option value="damage">Damage</option>
                                        <option value="death">Death</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.375rem' }}>Incident Date</label>
                                    <input type="date" max={new Date().toISOString().split('T')[0]} value={editForm.incident_date} onChange={(e) => setEditForm({ ...editForm, incident_date: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.375rem' }}>Amount (₹)</label>
                                    <input type="number" min="1" value={editForm.amount_claimed} onChange={(e) => setEditForm({ ...editForm, amount_claimed: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <button onClick={handleSaveEdit} className="btn-primary" style={{ fontSize: '0.8125rem', padding: '0.5rem 1rem' }}>Save</button>
                                    <button onClick={() => setEditing(false)} style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)', color: '#94a3b8', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8125rem' }}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Claim Type</p>
                                    <p style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 500, textTransform: 'capitalize' }}>{claim.claim_type}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Incident Date</p>
                                    <p style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 500 }}>{formatDate(claim.incident_date)}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Policy</p>
                                    <p style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 500 }}>{claim.user_policy?.policy?.title || 'Unknown'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Provider</p>
                                    <p style={{ fontSize: '1rem', color: '#e2e8f0', fontWeight: 500 }}>{claim.user_policy?.policy?.provider?.name || 'Unknown'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Documents ── */}
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>
                                Documents
                            </h3>
                        </div>

                        {/* Upload area with doc_type selector */}
                        {canEdit && (
                            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.04)', borderRadius: '0.5rem', border: '1px dashed rgba(99,102,241,0.25)' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <select
                                        value={uploadDocType}
                                        onChange={(e) => setUploadDocType(e.target.value)}
                                        style={{ flex: 1, padding: '0.5rem 0.75rem', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: '0.375rem', color: '#94a3b8', fontSize: '0.8125rem', outline: 'none' }}
                                    >
                                        {DOC_TYPE_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <label style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    color: '#818cf8', fontSize: '0.875rem', fontWeight: 600,
                                    padding: '0.625rem',
                                }}>
                                    <span>{uploading ? 'Uploading…' : '📎 Attach File'}</span>
                                    <input 
                                        type="file" 
                                        accept="image/jpeg,image/png,application/pdf"
                                        style={{ display: 'none' }} 
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                <p style={{ fontSize: '0.6875rem', color: '#64748b', textAlign: 'center' }}>JPEG, PNG, or PDF · Max 10MB</p>
                            </div>
                        )}

                        {claim.documents?.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', background: 'rgba(15,23,42,0.4)', borderRadius: '0.75rem', border: '1px dashed rgba(148,163,184,0.2)' }}>
                                <p style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📄</p>
                                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No documents uploaded yet.<br/>Attach bills, receipts, or photos.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {claim.documents?.map(doc => {
                                    const fileUrl = doc.file_url.startsWith('http') 
                                        ? doc.file_url 
                                        : `${API_URL}${doc.file_url}`;
                                    const isImage = doc.file_url.match(/\.(jpg|jpeg|png)$/i);
                                    const docLabel = DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type || 'Document';
                                    const isBeingDeleted = deleting === doc.id;
                                        
                                    return (
                                        <div key={doc.id} style={{ 
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            padding: '0.75rem 1rem', background: 'rgba(15,23,42,0.4)',
                                            borderRadius: '0.5rem', border: '1px solid rgba(148,163,184,0.1)',
                                            opacity: isBeingDeleted ? 0.5 : 1,
                                        }}>
                                            {/* Thumbnail / Icon */}
                                            {isImage ? (
                                                <img
                                                    src={fileUrl}
                                                    alt={docLabel}
                                                    onClick={() => setPreviewUrl(fileUrl)}
                                                    style={{
                                                        width: '44px', height: '44px', borderRadius: '0.375rem',
                                                        objectFit: 'cover', flexShrink: 0, cursor: 'zoom-in',
                                                        border: '1px solid rgba(148,163,184,0.2)',
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '44px', height: '44px', borderRadius: '0.375rem',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: 'rgba(239,68,68,0.08)', fontSize: '1.25rem', flexShrink: 0,
                                                }}>📄</div>
                                            )}

                                            {/* Info */}
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
                                                    {docLabel}
                                                </p>
                                                <p style={{ color: '#64748b', fontSize: '0.6875rem' }}>
                                                    {formatDate(doc.uploaded_at)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                                                <a 
                                                    href={fileUrl} target="_blank" rel="noopener noreferrer"
                                                    style={{ color: '#3b82f6', fontSize: '0.8125rem', fontWeight: 600, textDecoration: 'none' }}
                                                >
                                                    View
                                                </a>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => handleDelete(doc.id)}
                                                        disabled={isBeingDeleted}
                                                        style={{
                                                            background: 'none', border: 'none', cursor: 'pointer',
                                                            color: '#f87171', fontSize: '0.8125rem', fontWeight: 600,
                                                        }}
                                                    >
                                                        🗑️
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
