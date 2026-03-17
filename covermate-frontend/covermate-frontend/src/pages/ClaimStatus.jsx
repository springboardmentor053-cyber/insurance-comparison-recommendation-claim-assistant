import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const statusConfig = {
  draft:        { color: "#92400e", bg: "#fffbeb", border: "#fde68a", label: "Draft" },
  submitted:    { color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", label: "Submitted" },
  under_review: { color: "#d97706", bg: "#fffbeb", border: "#fde68a", label: "Under Review" },
  approved:     { color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0", label: "Approved" },
  rejected:     { color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", label: "Rejected" },
  paid:         { color: "#6d28d9", bg: "#f5f3ff", border: "#ddd6fe", label: "Paid" },
};

const progressSteps = ["submitted", "under_review", "approved", "paid"];

// ── Timeline component ─────────────────────────────────────
function ClaimTimeline({ claimId, token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://127.0.0.1:8000/claims/${claimId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => { setHistory(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [claimId, token]);

  if (loading) return null;
  if (history.length === 0) return null;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric"
    });
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <p style={{ fontSize: "13px", fontWeight: "600", color: "#334155", marginBottom: "14px" }}>
        Claim Timeline
      </p>

      <div style={{ position: "relative", paddingLeft: "20px" }}>
        {/* Vertical line */}
        <div style={{
          position: "absolute", left: "7px", top: "8px",
          width: "2px",
          height: `calc(100% - 24px)`,
          background: "#e2e8f0",
        }} />

        {history.map((item, index) => {
          const config = statusConfig[item.status] || statusConfig["submitted"];
          const isLast = index === history.length - 1;

          return (
            <div key={index} style={{
              display: "flex", gap: "14px",
              marginBottom: isLast ? 0 : "18px",
              position: "relative",
            }}>
              {/* Circle dot */}
              <div style={{
                width: "16px", height: "16px",
                borderRadius: "50%",
                background: config.color,
                border: `2px solid white`,
                boxShadow: `0 0 0 2px ${config.color}`,
                flexShrink: 0,
                marginTop: "2px",
                zIndex: 1,
              }} />

              {/* Content */}
              <div style={{ flex: 1, paddingBottom: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "4px" }}>
                  <span style={{
                    fontSize: "13px", fontWeight: "600",
                    color: config.color, textTransform: "capitalize",
                  }}>
                    {item.status.replace("_", " ")}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    {formatTime(item.changed_at)}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "2px 0 0" }}>
                  {formatDate(item.changed_at)}
                  {item.changed_by && item.changed_by !== "system" && item.changed_by !== "user" && (
                    <span style={{ marginLeft: "6px", color: "#94a3b8" }}>
                      · by {item.changed_by.replace("admin:", "")}
                    </span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ClaimStatus page ──────────────────────────────────
function ClaimStatus() {
  const { userPolicyId } = useParams();
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) { navigate("/login"); return; }

    axios
      .get("http://127.0.0.1:8000/claims/my-claims", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const filtered = res.data.filter(
          (c) => String(c.user_policy_id) === String(userPolicyId)
        );
        // Drafts first, then by date descending
        filtered.sort((a, b) => {
          if (a.status === "draft" && b.status !== "draft") return -1;
          if (a.status !== "draft" && b.status === "draft") return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        setClaims(filtered);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load claims. Please try again.");
        setLoading(false);
      });
  }, [userPolicyId, navigate, token]);

  if (loading) return (
    <p style={{ textAlign: "center", marginTop: "80px", color: "#64748b" }}>
      Loading claims...
    </p>
  );

  return (
    <div style={{
      padding: "40px", maxWidth: "780px",
      margin: "0 auto", fontFamily: "'Segoe UI', sans-serif",
    }}>

      {/* Back button */}
      <button
        onClick={() => navigate("/my-policies")}
        style={{
          marginBottom: "24px", padding: "8px 16px",
          border: "1px solid #e2e8f0", borderRadius: "8px",
          cursor: "pointer", background: "white",
          color: "#475569", fontWeight: "500", fontSize: "14px",
        }}
      >
        ← Back to My Policies
      </button>

      <h2 style={{ marginBottom: "4px", color: "#1e293b" }}>Claim Status</h2>
      <p style={{ color: "#64748b", marginBottom: "28px", fontSize: "14px" }}>
        All claims filed for Policy #{userPolicyId}
      </p>

      {error && (
        <div style={{
          background: "#fef2f2", color: "#b91c1c",
          border: "1px solid #fecaca", borderRadius: "10px",
          padding: "12px 16px", marginBottom: "20px",
        }}>
          {error}
        </div>
      )}

      {/* Empty state */}
      {claims.length === 0 && !error && (
        <div style={{
          textAlign: "center", padding: "60px 20px",
          background: "#f8fafc", borderRadius: "14px",
          border: "1px dashed #cbd5e1",
        }}>
          <p style={{ fontSize: "15px", color: "#64748b", marginBottom: "16px" }}>
            No claims found for this policy.
          </p>
          <button
            onClick={() => navigate(`/claim/${userPolicyId}`)}
            style={{
              padding: "11px 22px", background: "#2563eb",
              color: "white", border: "none", borderRadius: "9px",
              cursor: "pointer", fontWeight: "600", fontSize: "14px",
            }}
          >
            File a Claim
          </button>
        </div>
      )}

      {/* Claim cards */}
      {claims.map((claim) => {
        const config = statusConfig[claim.status] || statusConfig["submitted"];
        const isDraft = claim.status === "draft";
        const isRejected = claim.status === "rejected";
        const currentStepIndex = progressSteps.indexOf(claim.status);

        return (
          <div key={claim.claim_id} style={{
            background: "white",
            border: `1px solid ${isDraft ? "#fde68a" : "#e2e8f0"}`,
            borderRadius: "16px", padding: "26px",
            marginBottom: "20px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
          }}>

            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Claim Number</p>
                <p style={{ margin: "2px 0 0", fontWeight: "700", fontSize: "17px", color: "#1e293b" }}>
                  {claim.claim_number}
                </p>
              </div>
              <span style={{
                background: config.bg, color: config.color,
                border: `1px solid ${config.border}`,
                padding: "5px 14px", borderRadius: "20px",
                fontWeight: "600", fontSize: "13px",
              }}>
                {config.label}
              </span>
            </div>

            {/* Draft notice */}
            {isDraft && (
              <div style={{
                background: "#fffbeb", border: "1px solid #fde68a",
                borderRadius: "8px", padding: "10px 14px",
                fontSize: "13px", color: "#92400e", marginTop: "14px",
              }}>
                ✏️ This claim is saved as a draft. Complete and submit it to begin processing.
              </div>
            )}

            <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "16px 0" }} />

            {/* Details grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Claim Type</p>
                <p style={{ margin: "3px 0 0", fontWeight: "600", textTransform: "capitalize", color: "#1e293b" }}>
                  {claim.claim_type?.replace("_", " ") || "—"}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Amount Claimed</p>
                <p style={{ margin: "3px 0 0", fontWeight: "600", color: "#1a73e8" }}>
                  {claim.amount_claimed
                    ? `₹${claim.amount_claimed.toLocaleString("en-IN")}`
                    : "Not filled yet"}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Incident Date</p>
                <p style={{ margin: "3px 0 0", fontWeight: "600", color: "#1e293b" }}>
                  {claim.incident_date
                    ? new Date(claim.incident_date).toLocaleDateString("en-IN")
                    : "Not filled yet"}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>Filed On</p>
                <p style={{ margin: "3px 0 0", fontWeight: "600", color: "#1e293b" }}>
                  {new Date(claim.created_at).toLocaleDateString("en-IN")}
                </p>
              </div>
            </div>

            {/* Progress bar — submitted+ only */}
            {!isDraft && !isRejected && (
              <div style={{ marginTop: "22px" }}>
                <p style={{ margin: "0 0 10px", fontSize: "12px", color: "#94a3b8" }}>
                  Claim Progress
                </p>
                <div style={{ display: "flex", gap: "4px" }}>
                  {progressSteps.map((step, i) => (
                    <div key={step} style={{ flex: 1, textAlign: "center" }}>
                      <div style={{
                        height: "6px", borderRadius: "3px",
                        background: i <= currentStepIndex ? config.color : "#e2e8f0",
                        transition: "background 0.3s",
                      }} />
                      <p style={{ fontSize: "10px", marginTop: "5px", color: "#94a3b8", textTransform: "capitalize" }}>
                        {step.replace("_", " ")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected message */}
            {isRejected && (
              <div style={{
                marginTop: "16px", background: "#fef2f2",
                borderRadius: "8px", padding: "10px 14px",
                fontSize: "13px", color: "#b91c1c",
              }}>
                ✕ This claim was rejected. Please contact support for more information.
              </div>
            )}

            {/* ✅ Timeline — shown for all non-draft claims */}
            {!isDraft && (
              <>
                <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "20px 0 0" }} />
                <ClaimTimeline claimId={claim.claim_id} token={token} />
              </>
            )}

            {/* Draft action */}
            {isDraft && (
              <button
                onClick={() => navigate(`/claim/${userPolicyId}`)}
                style={{
                  marginTop: "18px", width: "100%", padding: "12px",
                  border: "none", borderRadius: "10px", fontWeight: "600",
                  fontSize: "14px", cursor: "pointer",
                  background: "linear-gradient(135deg, #2b6cb0, #4c6ef5)",
                  color: "white",
                }}
              >
                ✏️ Continue & Submit Draft
              </button>
            )}

            {/* Submitted lock message */}
            {claim.status === "submitted" && (
              <p style={{
                marginTop: "16px", fontSize: "12px",
                color: "#94a3b8", textAlign: "center",
              }}>
                🔒 Submitted — your claim is under review and cannot be edited.
              </p>
            )}

          </div>
        );
      })}

      {/* File another claim button */}
      {claims.length > 0 && !claims.find((c) => c.status === "draft") && (
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <button
            onClick={() => navigate(`/claim/${userPolicyId}`)}
            style={{
              padding: "11px 24px", background: "white",
              color: "#2563eb", border: "2px solid #2563eb",
              borderRadius: "9px", cursor: "pointer",
              fontWeight: "600", fontSize: "14px",
            }}
          >
            + File Another Claim
          </button>
        </div>
      )}

    </div>
  );
}

export default ClaimStatus;