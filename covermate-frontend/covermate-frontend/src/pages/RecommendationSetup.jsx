import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/auth.css";

const RecommendationSetup = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [familySize, setFamilySize] = useState("");
  const [budget, setBudget] = useState(20000);
  const [healthStatus, setHealthStatus] = useState("");

  const token = localStorage.getItem("token");

  // Age calculation
  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token, navigate]);

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const age = calculateAge(profile.dob);

      const res = await axios.post(
        "http://127.0.0.1:8000/recommendations/generate",
        {
          age,
          income: profile.annual_income,
          budget,
          family_size: parseInt(familySize),
          health_status: healthStatus,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem("recommendations", JSON.stringify(res.data));
      navigate("/recommendations", { state: { policies: res.data } });
    } catch {
      setError("Failed to generate recommendations. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !profile) {
    return <p className="loading-text">Loading your profile...</p>;
  }

  const age = calculateAge(profile.dob);

  const getRiskColor = (risk) => {
    if (!risk) return { bg: "#f1f5f9", color: "#64748b" };
    const v = risk.toLowerCase();
    if (v === "low") return { bg: "#e6fffa", color: "#0f766e" };
    if (v === "medium") return { bg: "#fff7ed", color: "#c2410c" };
    if (v === "high") return { bg: "#fee2e2", color: "#b91c1c" };
    return { bg: "#f1f5f9", color: "#64748b" };
  };

  const riskStyle = getRiskColor(profile.risk_profile);

  return (
    <div style={{
      minHeight: "calc(100vh - 62px)",
      background: "linear-gradient(135deg, #2b6cb0, #4c6ef5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "40px 20px",
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        background: "white",
        borderRadius: "18px",
        padding: "40px 44px",
        width: "100%",
        maxWidth: "520px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
      }}>

        {/* Header */}
        <h2 style={{
          textAlign: "center", fontSize: "22px",
          fontWeight: "700", color: "#1e293b", margin: "0 0 4px",
        }}>
          Get Recommendations
        </h2>
        <p style={{
          textAlign: "center", fontSize: "13px",
          color: "#94a3b8", margin: "0 0 24px",
        }}>
          Tell us your preferences to find the best policies for you
        </p>

        {/* User summary card */}
        <div style={{
          background: "#f8fafc", borderRadius: "12px",
          padding: "16px 20px", marginBottom: "24px",
          border: "1px solid #e2e8f0",
        }}>
          <p style={{
            fontSize: "11px", fontWeight: "700",
            color: "#94a3b8", textTransform: "uppercase",
            letterSpacing: "0.5px", margin: "0 0 12px",
          }}>
            Your Profile Summary
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {[
              { label: "Name", value: profile.name },
              { label: "Age", value: `${age} years` },
              { label: "Annual Income", value: `₹${Number(profile.annual_income).toLocaleString("en-IN")}` },
              { label: "Risk Profile", value: profile.risk_profile || "N/A", isRisk: true },
            ].map(({ label, value, isRisk }) => (
              <div key={label}>
                <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8" }}>{label}</p>
                {isRisk ? (
                  <span style={{
                    display: "inline-block",
                    marginTop: "3px",
                    background: riskStyle.bg,
                    color: riskStyle.color,
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}>
                    {value}
                  </span>
                ) : (
                  <p style={{ margin: "3px 0 0", fontWeight: "600", fontSize: "13px", color: "#1e293b" }}>
                    {value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: "#fef2f2", color: "#b91c1c",
            border: "1px solid #fecaca", borderRadius: "10px",
            padding: "10px 14px", fontSize: "13px", marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>

          {/* Family Size */}
          <div>
            <label style={{
              fontSize: "13px", fontWeight: "600",
              color: "#475569", display: "block", marginBottom: "6px",
            }}>
              Family Size
            </label>
            <select
              value={familySize}
              onChange={(e) => setFamilySize(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px 14px",
                borderRadius: "10px", border: "1px solid #e2e8f0",
                background: "#f8fafc", fontSize: "14px",
                boxSizing: "border-box", appearance: "none",
              }}
            >
              <option value="">Select family size</option>
              <option value="1">1 — Just me</option>
              <option value="2">2 — Me + Partner</option>
              <option value="3">3 — Small family</option>
              <option value="4">4+ — Large family</option>
            </select>
          </div>

          {/* Budget Slider */}
          <div>
            <label style={{
              fontSize: "13px", fontWeight: "600",
              color: "#475569", display: "block", marginBottom: "6px",
            }}>
              Annual Budget
              <span style={{
                marginLeft: "10px", fontSize: "14px",
                fontWeight: "700", color: "#2b6cb0",
              }}>
                ₹{budget.toLocaleString("en-IN")}
              </span>
            </label>
            <input
              type="range"
              min="5000"
              max="50000"
              step="1000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#2b6cb0" }}
            />
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: "11px", color: "#94a3b8", marginTop: "4px",
            }}>
              <span>₹5,000</span>
              <span>₹50,000</span>
            </div>
          </div>

          {/* Health Status */}
          <div>
            <label style={{
              fontSize: "13px", fontWeight: "600",
              color: "#475569", display: "block", marginBottom: "6px",
            }}>
              Health Status
            </label>
            <select
              value={healthStatus}
              onChange={(e) => setHealthStatus(e.target.value)}
              required
              style={{
                width: "100%", padding: "12px 14px",
                borderRadius: "10px", border: "1px solid #e2e8f0",
                background: "#f8fafc", fontSize: "14px",
                boxSizing: "border-box", appearance: "none",
              }}
            >
              <option value="">Select health status</option>
              <option value="good">Good — No known conditions</option>
              <option value="average">Average — Minor conditions</option>
              <option value="critical">Critical — Serious conditions</option>
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: "6px", padding: "14px",
              border: "none", borderRadius: "12px",
              background: submitting
                ? "#93c5fd"
                : "linear-gradient(135deg, #2b6cb0, #4c6ef5)",
              color: "white", fontWeight: "700",
              fontSize: "15px", cursor: submitting ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center",
              justifyContent: "center", minHeight: "50px",
              transition: "all 0.2s",
            }}
          >
            {submitting ? (
              <span style={{
                width: "18px", height: "18px",
                border: "2px solid rgba(255,255,255,0.4)",
                borderTopColor: "white", borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
                display: "inline-block",
              }} />
            ) : (
              "Get My Recommendations →"
            )}
          </button>

        </form>

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default RecommendationSetup;