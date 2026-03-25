import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const styles = `
  ${FONTS}

  .pc-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .pc-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #080c14;
    color: #e2e8f0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 48px 24px 80px;
    position: relative;
    overflow-x: hidden;
  }

  .pc-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.032) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.032) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }

  .pc-glow-1 {
    position: fixed; top: -180px; right: -180px;
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .pc-glow-2 {
    position: fixed; bottom: -180px; left: -140px;
    width: 460px; height: 460px;
    background: radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .pc-inner {
    position: relative; z-index: 1;
    width: 100%; max-width: 560px;
  }

  .pc-back {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 600; color: #475569;
    background: none; border: none; cursor: pointer;
    font-family: 'Sora', sans-serif;
    padding: 0; margin-bottom: 28px;
    transition: color 0.2s;
  }
  .pc-back:hover { color: #94a3b8; }

  .pc-card {
    background: rgba(13,18,30,0.92);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 24px;
    overflow: hidden;
    backdrop-filter: blur(16px);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.02),
      0 24px 72px rgba(0,0,0,0.5),
      0 0 48px rgba(99,102,241,0.06);
    animation: fadeUp 0.4s ease both;
  }

  .pc-card-bar {
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
  }

  .pc-card-body { padding: 32px 36px; }

  .pc-title {
    font-size: 24px; font-weight: 700;
    letter-spacing: -0.02em; color: #f1f5f9;
    margin-bottom: 4px;
  }
  .pc-title-accent {
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .pc-subtitle { font-size: 13px; color: #475569; margin-bottom: 28px; }

  .pc-field { margin-bottom: 24px; }

  .pc-label {
    display: block;
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 10px;
  }

  .pc-select-wrap { position: relative; }
  .pc-select {
    width: 100%;
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.65);
    border-radius: 14px;
    color: #e2e8f0; font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 500;
    padding: 13px 40px 13px 16px;
    appearance: none; cursor: pointer;
    transition: border-color 0.2s;
  }
  .pc-select:focus { outline: none; border-color: rgba(99,102,241,0.5); }
  .pc-select option { background: #0d1117; }
  .pc-chevron {
    position: absolute; right: 14px; top: 50%;
    transform: translateY(-50%);
    pointer-events: none; color: #475569;
  }

  .pc-policy-display {
    padding: 13px 16px;
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.65);
    border-radius: 14px;
    font-size: 14px; font-weight: 500; color: #e2e8f0;
  }

  .pc-age-row {
    display: flex; justify-content: space-between;
    align-items: center; margin-bottom: 12px;
  }
  .pc-age-right { display: flex; align-items: center; gap: 8px; }
  .pc-age-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px; font-weight: 700;
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .pc-load-badge {
    font-size: 10px; font-weight: 700; color: #f97316;
    background: rgba(249,115,22,0.1);
    border: 1px solid rgba(249,115,22,0.25);
    border-radius: 100px; padding: 3px 9px;
  }

  .pc-slider-track {
    position: relative; height: 6px;
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.5);
    border-radius: 100px; margin-bottom: 8px;
  }
  .pc-slider-fill {
    position: absolute; left: 0; top: 0; height: 100%;
    background: linear-gradient(90deg, #6366f1, #8b5cf6);
    border-radius: 100px; pointer-events: none;
    transition: width 0.1s;
  }
  .pc-slider {
    position: absolute; inset: 0;
    width: 100%; opacity: 0; cursor: pointer; margin: 0; height: 100%;
  }
  .pc-slider-thumb {
    position: absolute; top: 50%; transform: translateY(-50%);
    width: 20px; height: 20px; border-radius: 50%;
    background: #6366f1; border: 3px solid #080c14;
    box-shadow: 0 0 0 2px #6366f1;
    pointer-events: none; transition: left 0.1s;
  }
  .pc-slider-labels {
    display: flex; justify-content: space-between;
    font-size: 11px; color: #334155;
  }

  .pc-input {
    width: 100%;
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.65);
    border-radius: 14px;
    color: #e2e8f0; font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 500;
    padding: 13px 16px;
    transition: border-color 0.2s;
  }
  .pc-input::placeholder { color: #334155; }
  .pc-input:focus { outline: none; border-color: rgba(99,102,241,0.5); }

  .pc-advanced-toggle {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; font-weight: 600; color: #475569;
    background: none; border: none; cursor: pointer;
    font-family: 'Sora', sans-serif; padding: 0;
    margin-bottom: 20px; transition: color 0.2s;
  }
  .pc-advanced-toggle:hover { color: #818cf8; }

  .pc-advanced-fields {
    background: rgba(15,23,42,0.5);
    border: 1px solid rgba(51,65,85,0.4);
    border-radius: 14px; padding: 20px;
    margin-bottom: 24px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
  }

  .pc-calc-btn {
    width: 100%; padding: 15px;
    border: none; border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
    color: #fff; font-family: 'Sora', sans-serif;
    font-size: 15px; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 8px 32px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset;
    position: relative; overflow: hidden; letter-spacing: -0.01em;
  }
  .pc-calc-btn::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
    pointer-events: none;
  }
  .pc-calc-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }
  .pc-calc-btn:active:not(:disabled) { transform: translateY(0); }
  .pc-calc-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .pc-result { margin-top: 24px; animation: fadeUp 0.35s ease both; }

  .pc-result-hero {
    background: rgba(99,102,241,0.06);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 16px; padding: 24px;
    display: flex; justify-content: space-between; align-items: flex-start;
    margin-bottom: 16px;
  }
  .pc-result-label {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 6px;
  }
  .pc-result-amount {
    font-family: 'JetBrains Mono', monospace;
    font-size: 34px; font-weight: 700;
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text; margin-bottom: 4px;
  }
  .pc-result-per { font-size: 12px; color: #64748b; }
  .pc-age-pill {
    font-size: 10.5px; font-weight: 700;
    padding: 5px 12px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 100px; color: #818cf8;
    letter-spacing: 0.06em; text-transform: uppercase;
  }

  .pc-breakdown {
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(51,65,85,0.65);
    border-radius: 16px; padding: 20px; margin-bottom: 16px;
  }
  .pc-breakdown-title {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 14px;
  }
  .pc-breakdown-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 9px 0;
    border-bottom: 1px solid rgba(51,65,85,0.4);
    font-size: 13px;
  }
  .pc-breakdown-row:last-child { border-bottom: none; padding-bottom: 0; }
  .pc-breakdown-key { color: #64748b; font-weight: 500; }
  .pc-breakdown-val { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #e2e8f0; }
  .pc-breakdown-val.green { color: #34d399; }
  .pc-breakdown-val.amber { color: #fbbf24; }
  .pc-breakdown-val.red   { color: #f87171; }

  .pc-grid4 {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 10px; margin-bottom: 16px;
  }
  .pc-stat-card {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.65);
    border-radius: 12px; padding: 14px;
  }
  .pc-stat-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 6px;
  }
  .pc-stat-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px; font-weight: 700; color: #e2e8f0;
  }

  .pc-buy-btn {
    width: 100%; padding: 15px;
    border: 1px solid rgba(52,211,153,0.3);
    border-radius: 14px;
    background: rgba(52,211,153,0.08);
    color: #34d399; font-family: 'Sora', sans-serif;
    font-size: 15px; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: all 0.2s; letter-spacing: -0.01em;
  }
  .pc-buy-btn:hover {
    background: rgba(52,211,153,0.14);
    border-color: rgba(52,211,153,0.5);
  }

  .pc-error {
    padding: 12px 16px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.2);
    border-radius: 12px;
    font-size: 13px; color: #f87171; margin-top: 16px;
  }

  .spin { animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .pc-card-body { padding: 24px 20px; }
    .pc-grid4 { grid-template-columns: 1fr 1fr; }
    .pc-advanced-fields { grid-template-columns: 1fr; }
  }
`;

function fmt(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(n);
}
function fmtTerm(m) {
  if (!m) return '—';
  if (m >= 12) { const y = m / 12; return y === 1 ? '1 year' : `${y} years`; }
  return m === 1 ? '1 month' : `${m} months`;
}
function getLoadingPct(age) {
  if (age < 30) return 0;
  if (age < 40) return 5;
  if (age < 50) return 12;
  if (age < 60) return 20;
  if (age < 70) return 35;
  return 50;
}
function getRisk(age) {
  if (age < 30) return { label: 'Low',      cls: 'green' };
  if (age < 50) return { label: 'Moderate', cls: 'amber' };
  return           { label: 'High',      cls: 'red'   };
}

const TYPE_ICONS  = { life: '💚', health: '🏥', auto: '🚗', travel: '✈️', home: '🏠' };
const TYPE_COLORS = {
  health: 'linear-gradient(90deg,#10b981,#34d399)',
  life:   'linear-gradient(90deg,#6366f1,#8b5cf6)',
  auto:   'linear-gradient(90deg,#06b6d4,#0ea5e9)',
  home:   'linear-gradient(90deg,#f59e0b,#f97316)',
  travel: 'linear-gradient(90deg,#a855f7,#ec4899)',
};

export default function PremiumCalculator() {
  const navigate = useNavigate();
  const location = useLocation();

  // Passed from Policies.jsx: { policy, allPolicies }
  const preselected = location.state?.policy      || null;
  const allPolicies = location.state?.allPolicies || [];

  const [selectedPolicy, setSelectedPolicy] = useState(preselected);
  const [age,            setAge]            = useState(30);
  const [customTerm,     setCustomTerm]     = useState('');
  const [showAdvanced,   setShowAdvanced]   = useState(false);
  const [coverageAmt,    setCoverageAmt]    = useState('');
  const [riskFactor,     setRiskFactor]     = useState('');
  const [loading,        setLoading]        = useState(false);
  const [result,         setResult]         = useState(null);
  const [error,          setError]          = useState('');

  const loadingPct = getLoadingPct(age);
  const sliderPct  = ((age - 18) / (80 - 18)) * 100;
  const risk       = getRisk(age);
  const barColor   = TYPE_COLORS[selectedPolicy?.policy_type] || 'linear-gradient(90deg,#6366f1,#8b5cf6)';

  useEffect(() => { setResult(null); setError(''); }, [selectedPolicy, age, customTerm, coverageAmt, riskFactor]);

  const handleCalculate = async () => {
    if (!selectedPolicy) return;
    setLoading(true);
    setResult(null);
    setError('');

    try {
      // Matches your POST /policies/calculate endpoint exactly
      const payload = {
        policy_id:       selectedPolicy.id,
        age,
        term_months:     customTerm ? parseInt(customTerm) : selectedPolicy.term_months,
        coverage_amount: coverageAmt ? parseFloat(coverageAmt) : null,
        risk_factor:     riskFactor  ? parseFloat(riskFactor)  : null,
      };

      const { data } = await axios.post('http://127.0.0.1:8000/policies/calculate', payload);

      setResult({
        base:       data.base_premium,
        final:      data.calculated_premium,
        term:       customTerm ? parseInt(customTerm) : selectedPolicy.term_months,
        loadingPct,
        loadAmt:    Math.round((data.calculated_premium - data.base_premium) * 100) / 100,
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not calculate premium. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // After calculating, send user to your existing Quote.jsx to complete purchase
  const handleBuyNow = () => {
    navigate('/quote', { state: { policy: selectedPolicy } });
  };

  return (
    <>
      <style>{styles}</style>
      <div className="pc-root">
        <div className="pc-bg-grid" />
        <div className="pc-glow-1" />
        <div className="pc-glow-2" />

        <div className="pc-inner">

          <button className="pc-back" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Policies
          </button>

          <div className="pc-card">
            <div className="pc-card-bar" style={{ background: barColor }} />
            <div className="pc-card-body">

              <h1 className="pc-title">
                Premium <span className="pc-title-accent">Calculator</span>
              </h1>
              <p className="pc-subtitle">
                Get an instant quote adjusted for your age and coverage needs.
              </p>

              {/* Policy selector */}
              <div className="pc-field">
                <label className="pc-label">Select Policy</label>
                <div className="pc-select-wrap">
                  {allPolicies.length > 0 ? (
                    <>
                      <select
                        className="pc-select"
                        value={selectedPolicy?.id ?? ''}
                        onChange={(e) => {
                          const p = allPolicies.find((x) => String(x.id) === e.target.value);
                          setSelectedPolicy(p || null);
                        }}
                      >
                        {allPolicies.map((p) => (
                          <option key={p.id} value={p.id}>
                            {TYPE_ICONS[p.policy_type] || '📋'} {p.title} — {fmt(p.premium)}/mo
                          </option>
                        ))}
                      </select>
                      <span className="pc-chevron">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </span>
                    </>
                  ) : (
                    <div className="pc-policy-display">
                      {selectedPolicy
                        ? `${TYPE_ICONS[selectedPolicy.policy_type] || '📋'} ${selectedPolicy.title} — ${fmt(selectedPolicy.premium)}/mo`
                        : 'No policy selected — go back and click Calculator on a policy.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Age slider */}
              <div className="pc-field">
                <div className="pc-age-row">
                  <label className="pc-label" style={{ marginBottom: 0 }}>Your Age</label>
                  <div className="pc-age-right">
                    {loadingPct > 0 && (
                      <span className="pc-load-badge">+{loadingPct}% loading</span>
                    )}
                    <span className="pc-age-val">{age} YRS</span>
                  </div>
                </div>
                <div className="pc-slider-track">
                  <div className="pc-slider-fill" style={{ width: `${sliderPct}%` }} />
                  <div className="pc-slider-thumb" style={{ left: `calc(${sliderPct}% - 10px)` }} />
                  <input
                    type="range" min={18} max={80} step={1} value={age}
                    onChange={(e) => setAge(parseInt(e.target.value))}
                    className="pc-slider"
                  />
                </div>
                <div className="pc-slider-labels"><span>18</span><span>80</span></div>
              </div>

              {/* Custom term */}
              <div className="pc-field">
                <label className="pc-label">
                  Custom Term (Months){' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#334155' }}>
                    — optional
                  </span>
                </label>
                <input
                  type="number" min={1} max={360}
                  placeholder="Leave blank to use policy default"
                  value={customTerm}
                  onChange={(e) => setCustomTerm(e.target.value)}
                  className="pc-input"
                />
              </div>

              {/* Advanced options */}
              <button
                className="pc-advanced-toggle"
                onClick={() => setShowAdvanced((v) => !v)}
              >
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: showAdvanced ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                {showAdvanced ? 'Hide' : 'Show'} advanced options
              </button>

              {showAdvanced && (
                <div className="pc-advanced-fields">
                  <div>
                    <label className="pc-label">Coverage Amount (₹)</label>
                    <input
                      type="number" min={0} placeholder="e.g. 500000"
                      value={coverageAmt}
                      onChange={(e) => setCoverageAmt(e.target.value)}
                      className="pc-input"
                      style={{ padding: '11px 14px', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label className="pc-label">Risk Factor (0–1)</label>
                    <input
                      type="number" min={0} max={1} step={0.01} placeholder="e.g. 0.5"
                      value={riskFactor}
                      onChange={(e) => setRiskFactor(e.target.value)}
                      className="pc-input"
                      style={{ padding: '11px 14px', fontSize: 13 }}
                    />
                  </div>
                </div>
              )}

              <button
                className="pc-calc-btn"
                onClick={handleCalculate}
                disabled={loading || !selectedPolicy}
              >
                {loading ? (
                  <>
                    <svg className="spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Calculating…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="2" width="16" height="20" rx="2"/>
                      <line x1="8" y1="6" x2="16" y2="6"/>
                      <line x1="8" y1="10" x2="16" y2="10"/>
                      <line x1="8" y1="14" x2="12" y2="14"/>
                    </svg>
                    Calculate Premium
                  </>
                )}
              </button>

              {error && <div className="pc-error">{error}</div>}

              {result && (
                <div className="pc-result">
                  <div className="pc-result-hero">
                    <div>
                      <div className="pc-result-label">Estimated Premium</div>
                      <div className="pc-result-amount">{fmt(result.final)}</div>
                      <div className="pc-result-per">per month · {fmtTerm(result.term)} term</div>
                    </div>
                    <span className="pc-age-pill">
                      {result.loadingPct > 0 ? `+${result.loadingPct}% age load` : 'no age loading'}
                    </span>
                  </div>

                  <div className="pc-grid4">
                    {[
                      { label: 'Base Premium', val: fmt(result.base) },
                      { label: 'Age Loading',  val: result.loadingPct > 0 ? `+${fmt(result.loadAmt)}` : '₹0' },
                      { label: 'Policy Term',  val: fmtTerm(result.term) },
                      { label: 'Risk Level',   val: risk.label },
                    ].map(({ label, val }) => (
                      <div className="pc-stat-card" key={label}>
                        <div className="pc-stat-label">{label}</div>
                        <div className="pc-stat-val">{val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="pc-breakdown">
                    <div className="pc-breakdown-title">Price Breakdown</div>
                    <div className="pc-breakdown-row">
                      <span className="pc-breakdown-key">Base premium</span>
                      <span className="pc-breakdown-val">{fmt(result.base)}</span>
                    </div>
                    <div className="pc-breakdown-row">
                      <span className="pc-breakdown-key">Age loading (+{result.loadingPct}%)</span>
                      <span className={`pc-breakdown-val ${result.loadingPct > 0 ? 'amber' : 'green'}`}>
                        {result.loadingPct > 0 ? `+${fmt(result.loadAmt)}` : 'Nil'}
                      </span>
                    </div>
                    <div className="pc-breakdown-row">
                      <span className="pc-breakdown-key">Processing fee</span>
                      <span className="pc-breakdown-val green">Free</span>
                    </div>
                    <div className="pc-breakdown-row">
                      <span className="pc-breakdown-key">Risk assessment</span>
                      <span className={`pc-breakdown-val ${risk.cls}`}>{risk.label}</span>
                    </div>
                  </div>

                  <button className="pc-buy-btn" onClick={handleBuyNow}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    Buy this Policy · {fmt(result.final)}/mo
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </>
  );
}