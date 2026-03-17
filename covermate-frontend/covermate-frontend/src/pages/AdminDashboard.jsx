import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const statusConfig = {
  submitted:    { color: "#1d4ed8", bg: "#eff6ff", label: "Submitted" },
  under_review: { color: "#d97706", bg: "#fffbeb", label: "Under Review" },
  approved:     { color: "#15803d", bg: "#f0fdf4", label: "Approved" },
  rejected:     { color: "#b91c1c", bg: "#fef2f2", label: "Rejected" },
  paid:         { color: "#6d28d9", bg: "#f5f3ff", label: "Paid" },
};

const VALID_NEXT = {
  submitted:    ["under_review"],
  under_review: ["approved", "rejected"],
  approved:     ["paid"],
  rejected:     [],
  paid:         [],
};

function AdminDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null); // claim_id being updated
  const [msg, setMsg] = useState({ text: "", type: "" });

  const token = localStorage.getItem("token");

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  // ── Fetch analytics + claims ──────────────────────────────
  const fetchData = async () => {
    try {
      const [analyticsRes, claimsRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/admin/analytics", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("http://127.0.0.1:8000/admin/claims", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setAnalytics(analyticsRes.data);
      setClaims(claimsRes.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Access denied. Admin privileges required.");
      } else {
        setError("Failed to load dashboard data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    fetchData();
  }, [token, navigate]);

  // ── Update claim status ───────────────────────────────────
  const updateStatus = async (claimId, newStatus) => {
    setUpdating(claimId);
    try {
      await axios.put(
        `http://127.0.0.1:8000/admin/claims/${claimId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMsg(`Status updated to "${newStatus.replace("_", " ")}" successfully`);
      fetchData(); // refresh table
    } catch (err) {
      showMsg(err.response?.data?.detail || "Failed to update status.", "error");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <p style={{ textAlign: "center", marginTop: "80px", color: "#64748b" }}>
      Loading admin dashboard...
    </p>
  );

  if (error) return (
    <div style={{ maxWidth: "500px", margin: "80px auto", textAlign: "center" }}>
      <div style={{
        background: "#fef2f2", color: "#b91c1c",
        border: "1px solid #fecaca", borderRadius: "12px",
        padding: "24px", fontSize: "15px",
      }}>
        {error}
      </div>
      <button
        onClick={() => navigate("/")}
        style={{
          marginTop: "16px", padding: "10px 20px",
          background: "#2563eb", color: "white",
          border: "none", borderRadius: "8px",
          cursor: "pointer", fontWeight: "600",
        }}
      >
        Go Home
      </button>
    </div>
  );

  const metricCards = [
    { label: "Total Claims", value: analytics?.total_claims ?? 0, color: "#1a73e8" },
    { label: "Pending Review", value: (analytics?.submitted ?? 0) + (analytics?.under_review ?? 0), color: "#d97706" },
    { label: "Approved", value: analytics?.approved ?? 0, color: "#15803d" },
    { label: "Rejected", value: analytics?.rejected ?? 0, color: "#b91c1c" },
    { label: "Paid", value: analytics?.paid ?? 0, color: "#6d28d9" },
    { label: "Fraud Flagged", value: analytics?.fraud_flagged ?? 0, color: "#dc2626" },
    { label: "Total Users", value: analytics?.total_users ?? 0, color: "#0369a1" },
    { label: "Total Claimed", value: `₹${(analytics?.total_amount_claimed ?? 0).toLocaleString("en-IN")}`, color: "#1e293b" },
  ];

  return (
    <div style={{
      padding: "32px", fontFamily: "'Segoe UI', sans-serif",
      background: "#f4f6f9", minHeight: "100vh",
    }}>

      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ margin: 0, color: "#1e293b", fontSize: "22px" }}>Admin Dashboard</h2>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
          Manage claims, review fraud flags, update claim status
        </p>
      </div>

      {/* Notification */}
      {msg.text && (
        <div style={{
          padding: "12px 16px", borderRadius: "10px",
          marginBottom: "20px", fontSize: "14px", fontWeight: "500",
          background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: msg.type === "success" ? "#15803d" : "#b91c1c",
          border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`,
        }}>
          {msg.text}
        </div>
      )}

      {/* Analytics metric cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
        gap: "14px", marginBottom: "32px",
      }}>
        {metricCards.map(({ label, value, color }) => (
          <div key={label} style={{
            background: "white", borderRadius: "12px",
            padding: "18px 20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            borderLeft: `4px solid ${color}`,
          }}>
            <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: "500" }}>
              {label}
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "22px", fontWeight: "700", color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Claims table */}
      <div style={{
        background: "white", borderRadius: "14px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "18px 24px", borderBottom: "1px solid #f1f5f9",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h3 style={{ margin: 0, fontSize: "16px", color: "#1e293b" }}>
            All Claims ({claims.length})
          </h3>
        </div>

        {claims.length === 0 ? (
          <p style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
            No submitted claims yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%", borderCollapse: "collapse",
              fontSize: "13px",
            }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Claim Number", "User", "Type", "Amount", "Incident Date", "Status", "Fraud", "Action"].map((h) => (
                    <th key={h} style={{
                      padding: "12px 16px", textAlign: "left",
                      fontWeight: "600", color: "#475569",
                      borderBottom: "1px solid #e2e8f0",
                      whiteSpace: "nowrap",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => {
                  const config = statusConfig[claim.status] || statusConfig["submitted"];
                  const nextStatuses = VALID_NEXT[claim.status] || [];
                  const isFlagged = claim.is_flagged;

                  return (
                    <tr key={claim.claim_id} style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: isFlagged ? "#fffbeb" : "white",
                    }}>
                      {/* Claim number */}
                      <td style={{ padding: "14px 16px", fontWeight: "600", color: "#1e293b", whiteSpace: "nowrap" }}>
                        {claim.claim_number}
                      </td>

                      {/* User */}
                      <td style={{ padding: "14px 16px" }}>
                        <p style={{ margin: 0, fontWeight: "500", color: "#1e293b" }}>{claim.user_name}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" }}>{claim.user_email}</p>
                      </td>

                      {/* Type */}
                      <td style={{ padding: "14px 16px", textTransform: "capitalize", color: "#475569" }}>
                        {claim.claim_type?.replace("_", " ")}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: "14px 16px", fontWeight: "600", color: "#1a73e8", whiteSpace: "nowrap" }}>
                        {claim.amount_claimed
                          ? `₹${claim.amount_claimed.toLocaleString("en-IN")}`
                          : "—"}
                      </td>

                      {/* Incident date */}
                      <td style={{ padding: "14px 16px", color: "#475569", whiteSpace: "nowrap" }}>
                        {claim.incident_date
                          ? new Date(claim.incident_date).toLocaleDateString("en-IN")
                          : "—"}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          background: config.bg, color: config.color,
                          padding: "4px 10px", borderRadius: "20px",
                          fontWeight: "600", fontSize: "12px",
                          whiteSpace: "nowrap",
                        }}>
                          {config.label}
                        </span>
                      </td>

                      {/* Fraud flags */}
                      <td style={{ padding: "14px 16px" }}>
                        {isFlagged ? (
                          <span style={{
                            background: "#fef2f2", color: "#b91c1c",
                            padding: "4px 10px", borderRadius: "20px",
                            fontWeight: "600", fontSize: "12px",
                          }}>
                            ⚠ {claim.fraud_flags.length} flag{claim.fraud_flags.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>Clean</span>
                        )}
                      </td>

                      {/* Action — status update dropdown */}
                      <td style={{ padding: "14px 16px" }}>
                        {nextStatuses.length > 0 ? (
                          <select
                            defaultValue=""
                            disabled={updating === claim.claim_id}
                            onChange={(e) => {
                              if (e.target.value) updateStatus(claim.claim_id, e.target.value);
                            }}
                            style={{
                              padding: "7px 10px", borderRadius: "8px",
                              border: "1px solid #e2e8f0", fontSize: "12px",
                              background: "white", cursor: "pointer",
                              color: "#334155", fontWeight: "500",
                            }}
                          >
                            <option value="">Update status</option>
                            {nextStatuses.map((s) => (
                              <option key={s} value={s}>
                                → {s.replace("_", " ")}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                            {claim.status === "paid" ? "Completed" : "Final"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fraud flags detail section */}
      {claims.some((c) => c.is_flagged) && (
        <div style={{
          marginTop: "28px", background: "white",
          borderRadius: "14px", padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "16px", color: "#b91c1c" }}>
            ⚠ Fraud Flags Detail
          </h3>
          {claims.filter((c) => c.is_flagged).map((claim) => (
            <div key={claim.claim_id} style={{
              background: "#fffbeb", borderRadius: "10px",
              padding: "14px 16px", marginBottom: "10px",
              border: "1px solid #fde68a",
            }}>
              <p style={{ margin: "0 0 8px", fontWeight: "600", color: "#92400e", fontSize: "13px" }}>
                {claim.claim_number} — {claim.user_name}
              </p>
              {claim.fraud_flags.map((flag, i) => (
                <div key={i} style={{
                  display: "flex", gap: "10px", alignItems: "flex-start",
                  marginBottom: "4px",
                }}>
                  <span style={{
                    background: flag.severity === "high" ? "#fef2f2" : "#fffbeb",
                    color: flag.severity === "high" ? "#b91c1c" : "#d97706",
                    padding: "2px 8px", borderRadius: "20px",
                    fontSize: "11px", fontWeight: "600", flexShrink: 0,
                  }}>
                    {flag.severity.toUpperCase()}
                  </span>
                  <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>
                    {flag.detail}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default AdminDashboard;