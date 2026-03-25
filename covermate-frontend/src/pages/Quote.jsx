import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import api from '../services/api';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const styles = `
  ${FONTS}

  .qt-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .qt-root {
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

  .qt-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.032) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.032) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }

  .qt-glow-1 {
    position: fixed; top: -180px; right: -180px;
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .qt-glow-2 {
    position: fixed; bottom: -180px; left: -140px;
    width: 460px; height: 460px;
    background: radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .qt-inner {
    position: relative; z-index: 1;
    width: 100%; max-width: 560px;
  }

  /* ── BACK ── */
  .qt-back {
    display: inline-flex; align-items: center; gap: 7px;
    font-size: 13px; font-weight: 600; color: #475569;
    background: none; border: none; cursor: pointer;
    font-family: 'Sora', sans-serif;
    padding: 0; margin-bottom: 28px;
    transition: color 0.2s;
  }
  .qt-back:hover { color: #94a3b8; }

  /* ── CARD ── */
  .qt-card {
    background: rgba(13,18,30,0.92);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 24px;
    overflow: hidden;
    backdrop-filter: blur(16px);
    box-shadow: 0 0 0 1px rgba(255,255,255,0.02), 0 24px 72px rgba(0,0,0,0.5), 0 0 48px rgba(99,102,241,0.06);
    animation: fadeUp 0.4s ease both;
  }

  .qt-card-bar {
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
  }

  .qt-card-body { padding: 32px 36px; }

  /* ── POLICY HEADER ── */
  .qt-policy-head {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px;
    margin-bottom: 28px;
  }

  .qt-policy-icon {
    width: 52px; height: 52px; border-radius: 16px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
  }

  .qt-policy-name {
    font-size: 20px; font-weight: 700;
    letter-spacing: -0.02em; color: #f1f5f9;
    margin-bottom: 6px;
  }

  .qt-policy-type {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11.5px; font-weight: 600;
    color: #64748b; text-transform: capitalize;
  }

  .qt-type-dot {
    width: 5px; height: 5px; border-radius: 50%; background: #6366f1;
  }

  .qt-quote-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 12px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 100px;
    font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #818cf8; flex-shrink: 0;
  }

  /* ── DIVIDER ── */
  .qt-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.18), transparent);
    margin-bottom: 24px;
  }

  /* ── METRICS ── */
  .qt-metrics {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 12px; margin-bottom: 28px;
  }

  .qt-metric {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.65);
    border-radius: 14px; padding: 16px;
    text-align: center;
  }

  .qt-metric-icon {
    font-size: 18px; margin-bottom: 8px;
  }

  .qt-metric-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 6px;
  }

  .qt-metric-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 15px; font-weight: 700; color: #e2e8f0;
  }

  .qt-metric-val.premium { color: #a5b4fc; }
  .qt-metric-val.green   { color: #34d399; }

  /* ── COVERAGE ── */
  .qt-cov-section { margin-bottom: 28px; }

  .qt-cov-title {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 12px;
  }

  .qt-cov-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  }

  .qt-cov-item {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 12px;
    background: rgba(15,23,42,0.6);
    border: 1px solid rgba(51,65,85,0.5);
    border-radius: 10px;
    font-size: 12px;
  }

  .qt-cov-icon {
    width: 18px; height: 18px; border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .qt-cov-icon.yes { background: rgba(52,211,153,0.12); border: 1px solid rgba(52,211,153,0.25); }
  .qt-cov-icon.no  { background: rgba(239,68,68,0.1);   border: 1px solid rgba(239,68,68,0.2);   }

  .qt-cov-key { color: #94a3b8; text-transform: capitalize; flex: 1; }

  /* ── ORDER SUMMARY ── */
  .qt-summary {
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(99,102,241,0.18);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 24px;
  }

  .qt-summary-title {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 14px;
  }

  .qt-summary-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid rgba(51,65,85,0.4);
    font-size: 13px;
  }

  .qt-summary-row:last-child { border-bottom: none; padding-bottom: 0; }

  .qt-summary-key { color: #64748b; font-weight: 500; }

  .qt-summary-val {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600; color: #e2e8f0;
  }

  .qt-summary-total {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 14px; margin-top: 4px;
    border-top: 1px solid rgba(99,102,241,0.2);
  }

  .qt-summary-total-key {
    font-size: 14px; font-weight: 700; color: #f1f5f9;
  }

  .qt-summary-total-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px; font-weight: 700;
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── TRUST BADGES ── */
  .qt-trust {
    display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;
  }

  .qt-trust-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 11.5px; color: #475569; font-weight: 500;
  }

  .qt-trust-icon {
    width: 20px; height: 20px; border-radius: 6px;
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.2);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* ── BUY BUTTON ── */
  .qt-buy-btn {
    width: 100%; padding: 16px;
    border: none; border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
    color: #fff; font-family: 'Sora', sans-serif;
    font-size: 15px; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 8px 32px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.06) inset;
    position: relative; overflow: hidden;
    letter-spacing: -0.01em;
  }

  .qt-buy-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
    pointer-events: none;
  }

  .qt-buy-btn:hover:not(:disabled) {
    opacity: 0.92; transform: translateY(-1px);
    box-shadow: 0 12px 40px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset;
  }

  .qt-buy-btn:active:not(:disabled) { transform: translateY(0); }
  .qt-buy-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .qt-buy-sub {
    text-align: center; margin-top: 12px;
    font-size: 11.5px; color: #334155;
  }

  /* ── SUCCESS ── */
  .qt-success {
    text-align: center; padding: 60px 20px;
    animation: fadeUp 0.4s ease both;
  }

  .qt-success-ring {
    width: 80px; height: 80px; border-radius: 50%;
    background: rgba(52,211,153,0.12);
    border: 2px solid rgba(52,211,153,0.4);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; margin: 0 auto 20px;
    box-shadow: 0 0 32px rgba(52,211,153,0.2);
  }

  .qt-success-title {
    font-size: 22px; font-weight: 700; color: #f1f5f9;
    margin-bottom: 8px; letter-spacing: -0.02em;
  }

  .qt-success-sub { font-size: 13.5px; color: #64748b; margin-bottom: 28px; }

  .qt-success-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 13px 24px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 12px;
    color: #a5b4fc; font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
  }

  .qt-success-btn:hover { background: rgba(99,102,241,0.2); }

  .spin { animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 480px) {
    .qt-card-body { padding: 24px 20px; }
    .qt-metrics { grid-template-columns: 1fr 1fr; }
    .qt-cov-grid { grid-template-columns: 1fr; }
  }
`;

const TYPE_ICONS   = { life: '💚', health: '🏥', auto: '🚗', travel: '✈️', home: '🏠' };
const TYPE_COLORS  = {
  health: { bar: 'linear-gradient(90deg,#10b981,#34d399)' },
  life:   { bar: 'linear-gradient(90deg,#6366f1,#8b5cf6)' },
  auto:   { bar: 'linear-gradient(90deg,#06b6d4,#0ea5e9)' },
  home:   { bar: 'linear-gradient(90deg,#f59e0b,#f97316)' },
  travel: { bar: 'linear-gradient(90deg,#a855f7,#ec4899)' },
};

function fmt(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

function fmtTerm(m) {
  if (m >= 12) { const y = m / 12; return y === 1 ? '1 year' : `${y} years`; }
  return m === 1 ? '1 month' : `${m} months`;
}

const TRUST = [
  'Instant activation',
  'Secure & encrypted',
  'Cancel anytime',
];

export default function Quote() {
  const location = useLocation();
  const navigate = useNavigate();
  const policy = location.state?.policy;

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!policy) {
    return (
      <>
        <style>{styles}</style>
        <div className="qt-root">
          <div className="qt-bg-grid" /><div className="qt-glow-1" /><div className="qt-glow-2" />
          <div className="qt-inner" style={{ textAlign: 'center', paddingTop: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>No policy selected</div>
            <div style={{ fontSize: 13, color: '#475569' }}>Go back to browse and select a plan.</div>
          </div>
        </div>
      </>
    );
  }

  const colors = TYPE_COLORS[policy.policy_type] || TYPE_COLORS.life;
  const icon   = TYPE_ICONS[policy.policy_type]  || '📋';
  const tax    = Math.round(policy.premium * 0.18);
  const total  = policy.premium + tax;

  const handleBuy = async () => {
    try {
      setLoading(true);
      await api.post(`/policies/buy/${policy.id}`, {});
      setSuccess(true);
    } catch {
      // keep inline — no alert()
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="qt-root">
        <div className="qt-bg-grid" />
        <div className="qt-glow-1" />
        <div className="qt-glow-2" />

        <div className="qt-inner">

          {/* Back */}
          <button className="qt-back" onClick={() => navigate(-1)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Policies
          </button>

          {success ? (
            <div className="qt-card">
              <div className="qt-card-bar" style={{ background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
              <div className="qt-card-body">
                <div className="qt-success">
                  <div className="qt-success-ring">✓</div>
                  <div className="qt-success-title">Policy Purchased!</div>
                  <p className="qt-success-sub">
                    <strong style={{ color: '#e2e8f0' }}>{policy.title}</strong> is now active.<br/>
                    Check your inbox for confirmation details.
                  </p>
                  <button className="qt-success-btn" onClick={() => navigate('/my-policies')}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    View My Policies
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="qt-card">
              <div className="qt-card-bar" style={{ background: colors.bar }} />
              <div className="qt-card-body">

                {/* Policy header */}
                <div className="qt-policy-head">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <div className="qt-policy-icon">{icon}</div>
                    <div>
                      <div className="qt-policy-name">{policy.title}</div>
                      <div className="qt-policy-type">
                        <div className="qt-type-dot" />
                        {policy.policy_type} insurance
                      </div>
                    </div>
                  </div>
                  <div className="qt-quote-badge">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" fillRule="evenodd"/>
                    </svg>
                    Instant Quote
                  </div>
                </div>

                <div className="qt-divider" />

                {/* Metrics */}
                <div className="qt-metrics">
                  <div className="qt-metric">
                    <div className="qt-metric-icon">💰</div>
                    <div className="qt-metric-label">Premium</div>
                    <div className="qt-metric-val premium">{fmt(policy.premium)}</div>
                  </div>
                  <div className="qt-metric">
                    <div className="qt-metric-icon">📅</div>
                    <div className="qt-metric-label">Term</div>
                    <div className="qt-metric-val">{fmtTerm(policy.term_months)}</div>
                  </div>
                  <div className="qt-metric">
                    <div className="qt-metric-icon">🛡️</div>
                    <div className="qt-metric-label">Deductible</div>
                    <div className={`qt-metric-val ${policy.deductible === 0 ? 'green' : ''}`}>
                      {policy.deductible > 0 ? fmt(policy.deductible) : 'None'}
                    </div>
                  </div>
                </div>

                {/* Coverage */}
                {policy.coverage && Object.keys(policy.coverage).length > 0 && (
                  <>
                    <div className="qt-divider" />
                    <div className="qt-cov-section">
                      <div className="qt-cov-title">What's covered</div>
                      <div className="qt-cov-grid">
                        {Object.entries(policy.coverage).map(([key, val]) => (
                          <div className="qt-cov-item" key={key}>
                            <div className={`qt-cov-icon ${typeof val === 'boolean' ? (val ? 'yes' : 'no') : 'yes'}`}>
                              {typeof val === 'boolean' ? (
                                val
                                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              ) : (
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                            </div>
                            <span className="qt-cov-key">{key.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="qt-divider" />

                {/* Order summary */}
                <div className="qt-summary">
                  <div className="qt-summary-title">Order Summary</div>
                  <div className="qt-summary-row">
                    <span className="qt-summary-key">Base premium</span>
                    <span className="qt-summary-val">{fmt(policy.premium)}</span>
                  </div>
                  <div className="qt-summary-row">
                    <span className="qt-summary-key">GST (18%)</span>
                    <span className="qt-summary-val">{fmt(tax)}</span>
                  </div>
                  <div className="qt-summary-row">
                    <span className="qt-summary-key">Processing fee</span>
                    <span className="qt-summary-val" style={{ color: '#34d399' }}>Free</span>
                  </div>
                  <div className="qt-summary-total">
                    <span className="qt-summary-total-key">Total due today</span>
                    <span className="qt-summary-total-val">{fmt(total)}</span>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="qt-trust">
                  {TRUST.map((t) => (
                    <div className="qt-trust-item" key={t}>
                      <div className="qt-trust-icon">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      {t}
                    </div>
                  ))}
                </div>

                {/* Buy button */}
                <button className="qt-buy-btn" onClick={handleBuy} disabled={loading}>
                  {loading ? (
                    <>
                      <svg className="spin" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                      Buy Policy · {fmt(total)}
                    </>
                  )}
                </button>

                <div className="qt-buy-sub">
                  By purchasing, you agree to the terms & conditions of this policy.
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}