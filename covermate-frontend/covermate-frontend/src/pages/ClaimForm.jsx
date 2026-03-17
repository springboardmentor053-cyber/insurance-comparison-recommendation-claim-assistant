import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const DOC_TYPES = [
  { value: "accident_photo", label: "Accident Photo" },
  { value: "repair_bill", label: "Repair Bill" },
  { value: "medical_report", label: "Medical Report" },
  { value: "police_report", label: "Police Report" },
  { value: "other", label: "Other Document" },
];

function ClaimForm() {
  const { userPolicyId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [claimType, setClaimType] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [amount, setAmount] = useState("");
  const [claimId, setClaimId] = useState(null);
  const [claimNumber, setClaimNumber] = useState("");
  const [resumed, setResumed] = useState(false);

  // Document upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [docType, setDocType] = useState("other");
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const token = localStorage.getItem("token");

  // ── On mount: check for existing draft ──────────────────
  useEffect(() => {
    const fetchDraft = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/claims/my-claims", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const draft = res.data.find(
          (c) => String(c.user_policy_id) === String(userPolicyId) && c.status === "draft"
        );

        if (draft) {
          setClaimId(draft.claim_id);
          setClaimNumber(draft.claim_number);
          setResumed(true);
          if (draft.claim_type) setClaimType(draft.claim_type);
          if (draft.incident_date) setIncidentDate(draft.incident_date.split("T")[0]);
          if (draft.amount_claimed) setAmount(String(draft.amount_claimed));

          // Also load already uploaded docs for this draft
          const docsRes = await axios.get(
            `http://127.0.0.1:8000/claims/${draft.claim_id}/documents`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUploadedDocs(docsRes.data);

          // Jump to correct step
          if (draft.claim_type && draft.incident_date && draft.amount_claimed) {
            setStep(3); // Go to upload step
          } else if (draft.claim_type) {
            setStep(2);
          }
        }
      } catch {
        // No draft — fresh start
      } finally {
        setInitialLoading(false);
      }
    };
    fetchDraft();
  }, [userPolicyId, token]);

  // ── Step 1: Save/resume draft ────────────────────────────
  const handleStep1 = async () => {
    if (!claimType) { setError("Please select a claim type."); return; }
    setError(""); setLoading(true);
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/claims/draft",
        { user_policy_id: parseInt(userPolicyId), claim_type: claimType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setClaimId(res.data.claim_id);
      setClaimNumber(res.data.claim_number);
      setResumed(res.data.resumed);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save draft.");
    } finally { setLoading(false); }
  };

  // ── Step 2: Update draft with details ───────────────────
  const handleStep2 = async () => {
    if (!incidentDate || !amount) { setError("Please fill in all fields."); return; }
    if (parseFloat(amount) <= 0) { setError("Amount must be greater than 0."); return; }
    setError(""); setLoading(true);
    try {
      await axios.put(
        `http://127.0.0.1:8000/claims/${claimId}/draft`,
        { incident_date: incidentDate, amount: parseFloat(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update draft.");
    } finally { setLoading(false); }
  };

  // ── Step 3: Upload documents ─────────────────────────────
  const handleUpload = async () => {
    if (selectedFiles.length === 0) { setError("Please select at least one file."); return; }
    setError(""); setUploading(true);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("doc_type", docType);

        await axios.post(
          `http://127.0.0.1:8000/claims/${claimId}/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      }

      // Refresh uploaded docs list
      const docsRes = await axios.get(
        `http://127.0.0.1:8000/claims/${claimId}/documents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUploadedDocs(docsRes.data);
      setSelectedFiles([]);
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed. Check file type and size.");
    } finally { setUploading(false); }
  };

  // ── Delete an uploaded document ──────────────────────────
  const handleDeleteDoc = async (docId) => {
    try {
      await axios.delete(
        `http://127.0.0.1:8000/claims/documents/${docId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUploadedDocs(uploadedDocs.filter((d) => d.doc_id !== docId));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete document.");
    }
  };

  // ── Step 4: Final submit ─────────────────────────────────
  const handleSubmit = async () => {
    if (uploadedDocs.length === 0) {
      setError("Please upload at least one supporting document before submitting.");
      return;
    }
    setError(""); setLoading(true);
    try {
      await axios.patch(
        `http://127.0.0.1:8000/claims/${claimId}/submit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/claim-status/${userPolicyId}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to submit claim.");
    } finally { setLoading(false); }
  };

  // ── Styles ───────────────────────────────────────────────
  const card = {
    maxWidth: "520px", margin: "50px auto", background: "white",
    borderRadius: "18px", padding: "38px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.10)",
    fontFamily: "'Segoe UI', sans-serif",
  };
  const input = {
    width: "100%", padding: "12px 14px", borderRadius: "10px",
    border: "1px solid #e2e8f0", fontSize: "14px",
    background: "#f8fafc", boxSizing: "border-box", marginTop: "6px",
  };
  const label = {
    fontWeight: "600", fontSize: "13px",
    color: "#475569", display: "block", marginTop: "16px",
  };
  const primaryBtn = (disabled, bg) => ({
    width: "100%", padding: "13px", marginTop: "20px", border: "none",
    borderRadius: "11px", fontWeight: "600", fontSize: "15px",
    cursor: disabled ? "not-allowed" : "pointer",
    background: disabled ? "#93c5fd" : (bg || "linear-gradient(135deg,#2b6cb0,#4c6ef5)"),
    color: "white", display: "flex", alignItems: "center",
    justifyContent: "center", minHeight: "48px",
  });
  const secBtn = {
    padding: "11px 20px", border: "1px solid #e2e8f0", borderRadius: "10px",
    background: "white", color: "#64748b", fontWeight: "500",
    fontSize: "14px", cursor: "pointer", marginTop: "20px",
  };
  const spinner = (
    <span style={{
      width: "18px", height: "18px",
      border: "2px solid rgba(255,255,255,0.4)",
      borderTopColor: "white", borderRadius: "50%",
      animation: "spin 0.7s linear infinite", display: "inline-block",
    }} />
  );

  if (initialLoading) return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", paddingTop: "20px" }}>
      <div style={{ ...card, textAlign: "center", color: "#64748b" }}>
        Checking for existing drafts...
      </div>
    </div>
  );

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", paddingTop: "20px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={card}>

        {/* Header */}
        <h2 style={{ margin: "0 0 4px", color: "#1e293b", fontSize: "20px" }}>File Insurance Claim</h2>
        <p style={{ color: "#64748b", fontSize: "13px", margin: "0 0 22px" }}>Policy #{userPolicyId}</p>

        {/* 4-step progress bar */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {[1, 2, 3, 4].map((s) => (
            <div key={s} style={{
              flex: 1, height: "5px", borderRadius: "3px",
              background: step >= s ? "#2563eb" : "#e2e8f0",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Resumed notice */}
        {resumed && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#92400e", marginBottom: "14px" }}>
            ℹ️ Draft loaded. Continue from where you left off.
          </div>
        )}

        {/* Claim number badge */}
        {claimNumber && (
          <div style={{ background: "#eff6ff", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#1d4ed8", marginBottom: "14px", fontWeight: "500" }}>
            Draft — Claim #{claimNumber}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", marginBottom: "14px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── STEP 1: Claim Type ── */}
        {step === 1 && (
          <div>
            <h3 style={{ color: "#334155", fontSize: "16px", margin: "0 0 4px" }}>Step 1 of 4 — Claim Type</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>Select the type of claim to get started.</p>
            <label style={label}>Type of Claim</label>
            <select value={claimType} onChange={(e) => { setClaimType(e.target.value); setError(""); }} style={input}>
              <option value="">-- Select Claim Type --</option>
              <option value="accident">Accident</option>
              <option value="medical">Medical</option>
              <option value="damage">Damage</option>
              <option value="theft">Theft</option>
              <option value="fire">Fire</option>
              <option value="natural_disaster">Natural Disaster</option>
              <option value="other">Other</option>
            </select>
            <button style={primaryBtn(loading)} onClick={handleStep1} disabled={loading}>
              {loading ? spinner : "Save & Continue →"}
            </button>
          </div>
        )}

        {/* ── STEP 2: Incident Details ── */}
        {step === 2 && (
          <div>
            <h3 style={{ color: "#334155", fontSize: "16px", margin: "0 0 4px" }}>Step 2 of 4 — Incident Details</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>Provide details about the incident.</p>
            <label style={label}>Incident Date</label>
            <input type="date" value={incidentDate} max={new Date().toISOString().split("T")[0]} onChange={(e) => { setIncidentDate(e.target.value); setError(""); }} style={input} />
            <label style={label}>Claim Amount (₹)</label>
            <input type="number" placeholder="e.g. 50000" value={amount} min="1" onChange={(e) => { setAmount(e.target.value); setError(""); }} style={input} />
            <div style={{ display: "flex", gap: "12px" }}>
              <button style={secBtn} onClick={() => { setStep(1); setError(""); }}>← Back</button>
              <button style={{ ...primaryBtn(loading), flex: 1 }} onClick={handleStep2} disabled={loading}>
                {loading ? spinner : "Save & Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Upload Documents ── */}
        {step === 3 && (
          <div>
            <h3 style={{ color: "#334155", fontSize: "16px", margin: "0 0 4px" }}>Step 3 of 4 — Upload Documents</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "16px" }}>
              Upload supporting documents. Accepted: JPG, PNG, PDF. Max 10MB each.
            </p>

            <label style={label}>Document Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)} style={input}>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <label style={label}>Select Files</label>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => { setSelectedFiles(Array.from(e.target.files)); setError(""); }}
              style={{ ...input, padding: "10px" }}
            />

            {selectedFiles.length > 0 && (
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
                {selectedFiles.length} file(s) selected
              </p>
            )}

            <button
              style={primaryBtn(uploading, "linear-gradient(135deg,#0369a1,#0284c7)")}
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? spinner : "Upload Files"}
            </button>

            {/* Uploaded docs list */}
            {uploadedDocs.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <p style={{ fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "10px" }}>
                  Uploaded Documents ({uploadedDocs.length})
                </p>
                {uploadedDocs.map((doc) => (
                  <div key={doc.doc_id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 12px", background: "#f8fafc",
                    borderRadius: "8px", marginBottom: "6px",
                    border: "1px solid #e2e8f0",
                  }}>
                    <div>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "500", color: "#1e293b" }}>
                        {doc.filename}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8", textTransform: "capitalize" }}>
                        {doc.doc_type.replace("_", " ")}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <a href={doc.file_url} target="_blank" rel="noreferrer"
                        style={{ fontSize: "12px", color: "#2563eb", fontWeight: "500", textDecoration: "none" }}>
                        View
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(doc.doc_id)}
                        style={{ fontSize: "12px", color: "#dc2626", background: "none", border: "none", cursor: "pointer", fontWeight: "500" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button style={secBtn} onClick={() => { setStep(2); setError(""); }}>← Back</button>
              <button
                style={{ ...primaryBtn(uploadedDocs.length === 0), flex: 1 }}
                onClick={() => { if (uploadedDocs.length === 0) { setError("Please upload at least one document to continue."); return; } setStep(4); setError(""); }}
                disabled={uploadedDocs.length === 0}
              >
                Review & Submit →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Submit ── */}
        {step === 4 && (
          <div>
            <h3 style={{ color: "#334155", fontSize: "16px", margin: "0 0 4px" }}>Step 4 of 4 — Review & Submit</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginBottom: "20px" }}>
              Review everything carefully. Once submitted, the claim cannot be edited.
            </p>

            {/* Summary */}
            <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "18px", marginBottom: "12px" }}>
              {[
                { label: "Claim Number", value: `#${claimNumber}` },
                { label: "Claim Type", value: claimType.replace("_", " ") },
                { label: "Incident Date", value: incidentDate ? new Date(incidentDate).toLocaleDateString("en-IN") : "—" },
                { label: "Amount Claimed", value: amount ? `₹${parseFloat(amount).toLocaleString("en-IN")}` : "—" },
                { label: "Documents Uploaded", value: `${uploadedDocs.length} file(s)` },
              ].map(({ label: l, value }) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #e2e8f0", fontSize: "14px" }}>
                  <span style={{ color: "#64748b", fontWeight: "500" }}>{l}</span>
                  <span style={{ color: "#1e293b", fontWeight: "600", textTransform: "capitalize" }}>{value}</span>
                </div>
              ))}
            </div>

            <p style={{ fontSize: "12px", color: "#94a3b8", margin: "0 0 4px" }}>
              By submitting, you confirm all details and documents are accurate.
            </p>

            <div style={{ display: "flex", gap: "12px" }}>
              <button style={secBtn} onClick={() => { setStep(3); setError(""); }}>← Back</button>
              <button
                style={{ ...primaryBtn(loading, "linear-gradient(135deg,#15803d,#16a34a)"), flex: 1 }}
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? spinner : "✓ Submit Claim"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default ClaimForm;