import { useState } from "react";
import {
  updateRiskProfile,
  generateRecommendations,
} from "../services/profileService";

import {
  DollarSign,
  Users,
  Cigarette,
  HeartPulse,
  Wallet,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
`;

const styles = `
  ${FONTS}

  .rp-root * { box-sizing: border-box; }

  .rp-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #080c14;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 48px 20px 80px;
    position: relative;
    overflow-x: hidden;
  }

  .rp-bg-grid {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .rp-bg-glow {
    position: fixed;
    top: -200px;
    right: -200px;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .rp-bg-glow2 {
    position: fixed;
    bottom: -200px;
    left: -200px;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .rp-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 680px;
    background: rgba(13, 18, 30, 0.9);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 24px;
    padding: 48px;
    backdrop-filter: blur(20px);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03),
      0 32px 80px rgba(0,0,0,0.6),
      0 0 60px rgba(99,102,241,0.06);
  }

  /* HEADER */
  .rp-header {
    margin-bottom: 40px;
  }

  .rp-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    color: #818cf8;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  .rp-title {
    font-size: 28px;
    font-weight: 700;
    color: #f1f5f9;
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0 0 8px;
  }

  .rp-subtitle {
    font-size: 13.5px;
    color: #64748b;
    font-weight: 400;
    margin: 0;
    line-height: 1.6;
  }

  /* PROGRESS */
  .rp-progress {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
  }

  .rp-progress-step {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #475569;
    transition: color 0.2s;
  }

  .rp-progress-step.active { color: #818cf8; }
  .rp-progress-step.done { color: #34d399; }

  .rp-progress-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #334155;
    transition: background 0.2s;
  }

  .rp-progress-step.active .rp-progress-dot { background: #818cf8; box-shadow: 0 0 8px rgba(129,140,248,0.6); }
  .rp-progress-step.done .rp-progress-dot { background: #34d399; }

  .rp-progress-line {
    flex: 1;
    height: 1px;
    background: rgba(99,102,241,0.15);
  }

  /* SECTION */
  .rp-section-label {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
  }

  .rp-section-num {
    width: 26px; height: 26px;
    border-radius: 8px;
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #818cf8;
    font-family: 'JetBrains Mono', monospace;
  }

  .rp-section-title {
    font-size: 12px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* FIELD */
  .rp-field { margin-bottom: 20px; }

  .rp-label {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 12.5px;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 8px;
    letter-spacing: 0.01em;
  }

  .rp-label svg { color: #6366f1; flex-shrink: 0; }

  .rp-input {
    width: 100%;
    padding: 12px 16px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(51, 65, 85, 0.8);
    border-radius: 12px;
    color: #e2e8f0;
    font-size: 14px;
    font-family: 'Sora', sans-serif;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }

  .rp-input::placeholder { color: #475569; font-size: 13px; }

  .rp-input:focus {
    border-color: rgba(99,102,241,0.6);
    background: rgba(15, 23, 42, 1);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1), 0 0 20px rgba(99,102,241,0.05);
  }

  .rp-input:hover:not(:focus) { border-color: rgba(99,102,241,0.35); }

  .rp-select {
    width: 100%;
    padding: 12px 16px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(51, 65, 85, 0.8);
    border-radius: 12px;
    color: #e2e8f0;
    font-size: 14px;
    font-family: 'Sora', sans-serif;
    outline: none;
    appearance: none;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 40px;
  }

  .rp-select:focus {
    border-color: rgba(99,102,241,0.6);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }

  .rp-select option { background: #0f172a; }

  .rp-hint {
    font-size: 11.5px;
    color: #475569;
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ROW */
  .rp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

  /* POLICY GRID */
  .rp-policy-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }

  .rp-policy-card {
    position: relative;
    padding: 14px 12px;
    border-radius: 14px;
    border: 1px solid rgba(51,65,85,0.7);
    background: rgba(15, 23, 42, 0.6);
    cursor: pointer;
    transition: all 0.2s ease;
    overflow: hidden;
  }

  .rp-policy-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(99,102,241,0.08), transparent);
    opacity: 0;
    transition: opacity 0.2s;
  }

  .rp-policy-card:hover::before { opacity: 1; }
  .rp-policy-card:hover { border-color: rgba(99,102,241,0.4); transform: translateY(-1px); }

  .rp-policy-card.selected {
    border-color: #6366f1;
    background: rgba(99,102,241,0.12);
    box-shadow: 0 0 0 1px rgba(99,102,241,0.2), 0 8px 20px rgba(99,102,241,0.1);
  }

  .rp-policy-card.selected::before { opacity: 1; }

  .rp-policy-icon {
    font-size: 20px;
    margin-bottom: 6px;
  }

  .rp-policy-name {
    font-size: 12px;
    font-weight: 600;
    color: #cbd5e1;
    line-height: 1.3;
  }

  .rp-policy-card.selected .rp-policy-name { color: #a5b4fc; }

  .rp-policy-check {
    position: absolute;
    top: 8px; right: 8px;
    width: 16px; height: 16px;
    background: #6366f1;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform: scale(0.5);
    transition: all 0.2s;
  }

  .rp-policy-card.selected .rp-policy-check {
    opacity: 1;
    transform: scale(1);
  }

  /* TOGGLE */
  .rp-toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid rgba(51,65,85,0.8);
    border-radius: 12px;
    cursor: pointer;
    transition: border-color 0.2s;
  }

  .rp-toggle-row:hover { border-color: rgba(99,102,241,0.35); }

  .rp-toggle-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .rp-toggle-text { font-size: 14px; color: #cbd5e1; font-weight: 500; }
  .rp-toggle-sub { font-size: 11.5px; color: #475569; }

  .rp-switch {
    width: 44px; height: 24px;
    border-radius: 100px;
    background: #1e293b;
    border: 1px solid #334155;
    position: relative;
    transition: background 0.25s, border-color 0.25s;
    flex-shrink: 0;
  }

  .rp-switch.on {
    background: #6366f1;
    border-color: #6366f1;
    box-shadow: 0 0 12px rgba(99,102,241,0.4);
  }

  .rp-switch-thumb {
    position: absolute;
    top: 3px; left: 3px;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #475569;
    transition: transform 0.25s, background 0.25s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.4);
  }

  .rp-switch.on .rp-switch-thumb {
    transform: translateX(20px);
    background: #fff;
  }

  /* SLIDER */
  .rp-slider-wrap { padding: 4px 0; }

  .rp-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 100px;
    background: #1e293b;
    outline: none;
    cursor: pointer;
    position: relative;
  }

  .rp-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px; height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #6366f1;
    box-shadow: 0 0 0 4px rgba(99,102,241,0.2), 0 2px 8px rgba(0,0,0,0.4);
    cursor: pointer;
    transition: box-shadow 0.2s;
  }

  .rp-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 6px rgba(99,102,241,0.25), 0 2px 8px rgba(0,0,0,0.4);
  }

  .rp-risk-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
  }

  .rp-risk-pill {
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    color: #64748b;
    border: 1px solid transparent;
  }

  .rp-risk-pill.active-low {
    background: rgba(52,211,153,0.12);
    border-color: rgba(52,211,153,0.3);
    color: #34d399;
  }

  .rp-risk-pill.active-med {
    background: rgba(251,191,36,0.12);
    border-color: rgba(251,191,36,0.3);
    color: #fbbf24;
  }

  .rp-risk-pill.active-high {
    background: rgba(239,68,68,0.12);
    border-color: rgba(239,68,68,0.3);
    color: #ef4444;
  }

  /* DIVIDER */
  .rp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.2), transparent);
    margin: 32px 0;
  }

  /* SUMMARY STRIP */
  .rp-summary {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: rgba(99,102,241,0.15);
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid rgba(99,102,241,0.15);
    margin-bottom: 28px;
  }

  .rp-summary-item {
    background: rgba(13,18,30,0.95);
    padding: 14px 16px;
    text-align: center;
  }

  .rp-summary-val {
    font-size: 15px;
    font-weight: 700;
    color: #e2e8f0;
    font-family: 'JetBrains Mono', monospace;
    margin-bottom: 3px;
  }

  .rp-summary-key {
    font-size: 10.5px;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-weight: 600;
  }

  /* SUBMIT */
  .rp-submit {
    width: 100%;
    padding: 16px;
    border: none;
    border-radius: 14px;
    cursor: pointer;
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
    position: relative;
    overflow: hidden;
    transition: opacity 0.2s, transform 0.15s;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
    box-shadow: 0 8px 32px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset;
  }

  .rp-submit::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%);
    pointer-events: none;
  }

  .rp-submit:hover:not(:disabled) {
    opacity: 0.93;
    transform: translateY(-1px);
    box-shadow: 0 12px 40px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset;
  }

  .rp-submit:active:not(:disabled) { transform: translateY(0); }

  .rp-submit:disabled { opacity: 0.6; cursor: not-allowed; }

  .rp-submit-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* TOAST */
  .rp-toast {
    position: fixed;
    top: 24px; right: 24px;
    z-index: 100;
    padding: 14px 20px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13.5px;
    font-weight: 600;
    font-family: 'Sora', sans-serif;
    animation: slideIn 0.3s ease;
    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
  }

  .rp-toast.success {
    background: rgba(16,185,129,0.15);
    border: 1px solid rgba(52,211,153,0.4);
    color: #34d399;
  }

  .rp-toast.error {
    background: rgba(239,68,68,0.12);
    border: 1px solid rgba(239,68,68,0.3);
    color: #f87171;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @media (max-width: 600px) {
    .rp-card { padding: 28px 20px; }
    .rp-row { grid-template-columns: 1fr; }
    .rp-policy-grid { grid-template-columns: repeat(2, 1fr); }
    .rp-summary { grid-template-columns: 1fr; }
  }
`;

const POLICIES = [
  { value: "health", label: "Health", icon: "🏥" },
  { value: "life", label: "Life", icon: "💚" },
  { value: "auto", label: "Auto", icon: "🚗" },
  { value: "travel", label: "Travel", icon: "✈️" },
  { value: "home", label: "Home", icon: "🏠" },
];

const RISK_LABEL = { 1: "Low Risk", 2: "Balanced", 3: "High Risk" };
const RISK_COLOR = { 1: "active-low", 2: "active-med", 3: "active-high" };

const formatINR = (val) => {
  if (!val) return "—";
  const n = Number(val);
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
};

const RiskProfile = () => {
  const [policyType, setPolicyType] = useState("");
  const [budget, setBudget] = useState("");
  const [riskAppetite, setRiskAppetite] = useState(2);
  const [coverage, setCoverage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [income, setIncome] = useState("");
  const [familySize, setFamilySize] = useState("");
  const [smoker, setSmoker] = useState(false);
  const [conditions, setConditions] = useState([]);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    if (!income || !policyType || !coverage) {
      showToast("error", "Please fill in all required fields.");
      return;
    }
    try {
      setLoading(true);
      const riskProfile = {
        income: Number(income),
        family_size: Number(familySize),
        smoker,
        existing_conditions: conditions.filter((c) => c.trim() !== ""),
        risk_appetite: Number(riskAppetite) === 1 ? "low" : Number(riskAppetite) === 2 ? "medium" : "high",
        coverage_priority: coverage,
        preferred_types: policyType ? [policyType] : [],
        budget_limit: Number(budget),
      };
      await updateRiskProfile(riskProfile);
      await generateRecommendations();
      showToast("success", "Recommendations generated successfully!");
    } catch (err) {
      console.error(err);
      showToast("error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const riskFill = ((riskAppetite - 1) / 2) * 100;

  return (
    <>
      <style>{styles}</style>

      {toast && (
        <div className={`rp-toast ${toast.type}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="rp-root">
        <div className="rp-bg-grid" />
        <div className="rp-bg-glow" />
        <div className="rp-bg-glow2" />

        <div className="rp-card">

          {/* Header */}
          <div className="rp-header">
            <h1 className="rp-title">Build Your Risk Profile</h1>
            <p className="rp-subtitle">
              We'll analyze your inputs to surface insurance plans perfectly matched to your situation.
            </p>

            <div className="rp-progress" style={{ marginTop: 20 }}>
              <div className="rp-progress-step done">
                <div className="rp-progress-dot" />
                Personal
              </div>
              <div className="rp-progress-line" />
              <div className="rp-progress-step active">
                <div className="rp-progress-dot" />
                Preferences
              </div>
              <div className="rp-progress-line" />
              <div className="rp-progress-step">
                <div className="rp-progress-dot" />
                Review
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <div className="rp-section-label">
            <div className="rp-section-num">01</div>
            <div className="rp-section-title">Personal Information</div>
          </div>

          <div className="rp-row">
            <div className="rp-field">
              <label className="rp-label">
                <DollarSign size={13} />
                Annual Income
              </label>
              <input
                type="number"
                className="rp-input"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="e.g. 600000"
              />
              <div className="rp-hint">In Indian Rupees (₹)</div>
            </div>

            <div className="rp-field">
              <label className="rp-label">
                <Users size={13} />
                Family Size
              </label>
              <input
                type="number"
                className="rp-input"
                value={familySize}
                onChange={(e) => setFamilySize(e.target.value)}
                placeholder="e.g. 3"
              />
              <div className="rp-hint">Including yourself</div>
            </div>
          </div>

          <div className="rp-field">
            <label className="rp-label">
              <Cigarette size={13} />
              Smoking Status
            </label>
            <div
              className="rp-toggle-row"
              onClick={() => setSmoker(!smoker)}
            >
              <div className="rp-toggle-left">
                <div>
                  <div className="rp-toggle-text">
                    {smoker ? "Smoker" : "Non-Smoker"}
                  </div>
                  <div className="rp-toggle-sub">
                    {smoker ? "Affects premium rates" : "No additional premium loading"}
                  </div>
                </div>
              </div>
              <div className={`rp-switch ${smoker ? "on" : ""}`}>
                <div className="rp-switch-thumb" />
              </div>
            </div>
          </div>

          <div className="rp-field">
            <label className="rp-label">
              <HeartPulse size={13} />
              Existing Medical Conditions
            </label>
            <input
              type="text"
              className="rp-input"
              placeholder="e.g. diabetes, hypertension, asthma"
              onChange={(e) => setConditions(e.target.value.split(","))}
            />
            <div className="rp-hint">Separate multiple conditions with commas</div>
          </div>

          <div className="rp-divider" />

          {/* Section 2 */}
          <div className="rp-section-label">
            <div className="rp-section-num">02</div>
            <div className="rp-section-title">Insurance Preferences</div>
          </div>

          <div className="rp-field">
            <label className="rp-label" style={{ marginBottom: 12 }}>
              Policy Type
            </label>
            <div className="rp-policy-grid">
              {POLICIES.map((p) => (
                <div
                  key={p.value}
                  className={`rp-policy-card ${policyType === p.value ? "selected" : ""}`}
                  onClick={() => setPolicyType(p.value)}
                >
                  <div className="rp-policy-icon">{p.icon}</div>
                  <div className="rp-policy-name">{p.label}</div>
                  <div className="rp-policy-check">
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rp-row">
            <div className="rp-field">
              <label className="rp-label">
                <Wallet size={13} />
                Budget Limit
              </label>
              <input
                type="number"
                className="rp-input"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. 20000"
              />
              <div className="rp-hint">Annual premium in ₹</div>
            </div>

            <div className="rp-field">
              <label className="rp-label">Coverage Priority</label>
              <select
                className="rp-select"
                value={coverage}
                onChange={(e) => setCoverage(e.target.value)}
              >
                <option value="">Select level</option>
                <option value="low">Basic Coverage</option>
                <option value="medium">Balanced Coverage</option>
                <option value="high">Maximum Coverage</option>
              </select>
            </div>
          </div>

          <div className="rp-field">
            <label className="rp-label">
              <ShieldCheck size={13} />
              Risk Appetite
            </label>
            <div className="rp-slider-wrap">
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute",
                  top: "50%",
                  transform: "translateY(-50%)",
                  left: 0,
                  width: `${riskFill}%`,
                  height: 4,
                  background: "linear-gradient(90deg, #34d399, #fbbf24, #ef4444)",
                  borderRadius: "100px",
                  pointerEvents: "none",
                  transition: "width 0.2s",
                }} />
                <input
                  type="range"
                  min="1" max="3"
                  value={riskAppetite}
                  onChange={(e) => setRiskAppetite(Number(e.target.value))}
                  className="rp-slider"
                  style={{ background: "transparent" }}
                />
              </div>
              <div className="rp-risk-labels">
                {[1, 2, 3].map((v) => (
                  <span
                    key={v}
                    className={`rp-risk-pill ${riskAppetite === v ? RISK_COLOR[v] : ""}`}
                    onClick={() => setRiskAppetite(v)}
                  >
                    {RISK_LABEL[v]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rp-divider" />

          {/* Summary */}
          <div className="rp-summary">
            <div className="rp-summary-item">
              <div className="rp-summary-val">{formatINR(income)}</div>
              <div className="rp-summary-key">Income</div>
            </div>
            <div className="rp-summary-item">
              <div className="rp-summary-val">{formatINR(budget)}</div>
              <div className="rp-summary-key">Budget</div>
            </div>
            <div className="rp-summary-item">
              <div className="rp-summary-val" style={{
                color: riskAppetite === 1 ? "#34d399" : riskAppetite === 2 ? "#fbbf24" : "#f87171"
              }}>
                {RISK_LABEL[riskAppetite]}
              </div>
              <div className="rp-summary-key">Risk Level</div>
            </div>
          </div>

          {/* Submit */}
          <button className="rp-submit" onClick={handleSubmit} disabled={loading}>
            <div className="rp-submit-inner">
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Generate My Recommendations
                  <ChevronRight size={16} style={{ opacity: 0.7 }} />
                </>
              )}
            </div>
          </button>

        </div>
      </div>
    </>
  );
};

export default RiskProfile;