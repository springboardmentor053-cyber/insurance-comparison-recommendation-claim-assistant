import { useEffect, useState } from 'react';
import axios from 'axios';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const styles = `
  ${FONTS}

  .mp-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .mp-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #080c14;
    color: #e2e8f0;
    padding: 48px 24px 80px;
    position: relative;
    overflow-x: hidden;
  }

  .mp-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }

  .mp-glow-1 {
    position: fixed; top: -180px; right: -180px;
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .mp-glow-2 {
    position: fixed; bottom: -200px; left: -150px;
    width: 460px; height: 460px;
    background: radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .mp-inner {
    position: relative; z-index: 1;
    max-width: 860px; margin: 0 auto;
  }

  /* ── HEADER ── */
  .mp-header { margin-bottom: 36px; }

  .mp-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 100px;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: #818cf8;
    margin-bottom: 14px;
  }

  .mp-title {
    font-size: 30px; font-weight: 700;
    letter-spacing: -0.025em; color: #f1f5f9;
    line-height: 1.15; margin-bottom: 8px;
  }

  .mp-subtitle { font-size: 13.5px; color: #64748b; line-height: 1.6; }

  /* ── STATS ── */
  .mp-stats {
    display: flex; gap: 1px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 16px; overflow: hidden;
    margin-bottom: 36px;
  }

  .mp-stat {
    flex: 1; background: rgba(10,14,24,0.95);
    padding: 16px 20px; text-align: center;
  }

  .mp-stat-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px; font-weight: 600;
    color: #f1f5f9; margin-bottom: 4px;
  }

  .mp-stat-key {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em; color: #475569;
  }

  /* ── EMPTY / LOADING ── */
  .mp-empty {
    text-align: center; padding: 80px 20px;
    border: 1px dashed rgba(99,102,241,0.2);
    border-radius: 20px; background: rgba(10,14,24,0.5);
  }

  .mp-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .mp-empty-title { font-size: 18px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
  .mp-empty-sub { font-size: 13px; color: #475569; }

  .mp-skeleton {
    background: linear-gradient(90deg, rgba(30,41,59,0.8) 25%, rgba(51,65,85,0.5) 50%, rgba(30,41,59,0.8) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 10px; height: 14px; margin-bottom: 10px;
  }
  @keyframes shimmer { to { background-position: -200% 0; } }

  /* ── GRID ── */
  .mp-grid { display: flex; flex-direction: column; gap: 16px; }

  /* ── CARD ── */
  .mp-card {
    background: rgba(13,18,30,0.9);
    border: 1px solid rgba(51,65,85,0.7);
    border-radius: 20px;
    overflow: hidden;
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    transition: border-color 0.25s, box-shadow 0.2s, transform 0.2s;
    animation: fadeUp 0.4s ease both;
    position: relative;
  }

  .mp-card.active {
    border-color: rgba(99,102,241,0.35);
    box-shadow: 0 0 0 1px rgba(99,102,241,0.1), 0 8px 40px rgba(99,102,241,0.08);
  }

  .mp-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 48px rgba(0,0,0,0.4), 0 0 30px rgba(99,102,241,0.07);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* card accent bar */
  .mp-card-bar {
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
  }

  .mp-card.cancelled .mp-card-bar { background: #334155; }
  .mp-card.expired .mp-card-bar { background: linear-gradient(90deg, #f59e0b, #ef4444); }

  /* card body */
  .mp-card-body { padding: 26px 28px; }

  /* top row */
  .mp-card-top {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px;
    margin-bottom: 20px;
  }

  .mp-card-left { flex: 1; }

  .mp-policy-name {
    font-size: 19px; font-weight: 700;
    letter-spacing: -0.02em; color: #f1f5f9;
    margin-bottom: 6px;
  }

  .mp-policy-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px; color: #475569; font-weight: 500;
    display: flex; align-items: center; gap: 6px;
  }

  .mp-policy-num-dot {
    width: 5px; height: 5px; border-radius: 50%; background: #334155;
  }

  /* status badge */
  .mp-status {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px;
    border-radius: 100px;
    font-size: 11.5px; font-weight: 700;
    text-transform: capitalize; letter-spacing: 0.03em;
    flex-shrink: 0;
  }

  .mp-status.active {
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.3);
    color: #34d399;
  }

  .mp-status.cancelled {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    color: #f87171;
  }

  .mp-status.expired {
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.25);
    color: #fbbf24;
  }

  .mp-status-dot {
    width: 6px; height: 6px; border-radius: 50%;
  }

  .mp-status.active .mp-status-dot {
    background: #34d399;
    box-shadow: 0 0 6px #34d399;
    animation: pulse 2s infinite;
  }

  .mp-status.cancelled .mp-status-dot { background: #f87171; }
  .mp-status.expired .mp-status-dot { background: #fbbf24; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* divider */
  .mp-card-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent);
    margin-bottom: 20px;
  }

  /* meta grid */
  .mp-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 22px;
  }

  .mp-meta-item {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.6);
    border-radius: 12px;
    padding: 12px 14px;
  }

  .mp-meta-label {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #475569; margin-bottom: 5px;
  }

  .mp-meta-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px; font-weight: 600; color: #e2e8f0;
  }

  /* date row */
  .mp-dates {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: rgba(15,23,42,0.6);
    border: 1px solid rgba(51,65,85,0.5);
    border-radius: 12px;
  }

  .mp-date-item { flex: 1; }

  .mp-date-label {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #475569; margin-bottom: 4px;
  }

  .mp-date-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; color: #94a3b8; font-weight: 500;
  }

  .mp-date-sep {
    flex-shrink: 0; color: #334155; font-size: 18px; padding: 0 4px;
  }

  /* progress bar */
  .mp-progress-wrap { margin-bottom: 22px; }

  .mp-progress-label {
    display: flex; justify-content: space-between;
    font-size: 10.5px; color: #475569; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.07em;
    margin-bottom: 8px;
  }

  .mp-progress-track {
    height: 4px; background: rgba(51,65,85,0.6); border-radius: 100px; overflow: hidden;
  }

  .mp-progress-fill {
    height: 100%; border-radius: 100px;
    background: linear-gradient(90deg, #6366f1, #a855f7);
    transition: width 0.8s ease;
    box-shadow: 0 0 8px rgba(99,102,241,0.5);
  }

  .mp-progress-fill.expired { background: linear-gradient(90deg, #f59e0b, #ef4444); box-shadow: none; }
  .mp-progress-fill.cancelled { background: #334155; box-shadow: none; }

  /* footer */
  .mp-card-footer {
    display: flex; align-items: center; justify-content: flex-end; gap: 10px;
    padding-top: 16px;
    border-top: 1px solid rgba(51,65,85,0.5);
  }

  /* cancel button */
  .mp-cancel-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 10px 18px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: 11px;
    color: #f87171; font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .mp-cancel-btn:hover:not(:disabled) {
    background: rgba(239,68,68,0.15);
    border-color: rgba(239,68,68,0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(239,68,68,0.15);
  }

  .mp-cancel-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* confirm modal */
  .mp-modal-backdrop {
    position: fixed; inset: 0; z-index: 50;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

  .mp-modal {
    background: #0d1220;
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 20px;
    padding: 32px;
    max-width: 420px; width: 100%;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6);
    animation: scaleIn 0.2s ease;
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }

  .mp-modal-icon {
    width: 52px; height: 52px; border-radius: 16px;
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; margin-bottom: 20px;
  }

  .mp-modal-title {
    font-size: 19px; font-weight: 700; color: #f1f5f9;
    letter-spacing: -0.02em; margin-bottom: 8px;
  }

  .mp-modal-sub { font-size: 13.5px; color: #64748b; line-height: 1.6; margin-bottom: 28px; }

  .mp-modal-actions { display: flex; gap: 10px; }

  .mp-modal-cancel {
    flex: 1; padding: 12px;
    background: rgba(51,65,85,0.4);
    border: 1px solid rgba(51,65,85,0.7);
    border-radius: 12px; color: #94a3b8;
    font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }

  .mp-modal-cancel:hover { background: rgba(51,65,85,0.7); color: #e2e8f0; }

  .mp-modal-confirm {
    flex: 1; padding: 12px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border: none; border-radius: 12px; color: #fff;
    font-family: 'Sora', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(239,68,68,0.3);
    display: flex; align-items: center; justify-content: center; gap: 7px;
  }

  .mp-modal-confirm:hover { opacity: 0.9; transform: translateY(-1px); }

  .spin { animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* toast */
  .mp-toast {
    position: fixed; top: 24px; right: 24px; z-index: 100;
    padding: 13px 20px;
    border-radius: 14px;
    display: flex; align-items: center; gap: 9px;
    font-size: 13.5px; font-weight: 600; font-family: 'Sora', sans-serif;
    animation: slideIn 0.3s ease;
    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
  }

  .mp-toast.success {
    background: rgba(16,185,129,0.13); border: 1px solid rgba(52,211,153,0.35); color: #34d399;
  }

  .mp-toast.error {
    background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171;
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @media (max-width: 600px) {
    .mp-meta { grid-template-columns: 1fr 1fr; }
    .mp-card-top { flex-direction: column; }
    .mp-stats { flex-wrap: wrap; }
    .mp-stat { min-width: 50%; }
  }
`;

const TYPE_ICONS = { life: "💚", health: "🏥", auto: "🚗", travel: "✈️", home: "🏠" };

const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const calcProgress = (start, end) => {
  const now = Date.now();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (now >= e) return 100;
  if (now <= s) return 0;
  return Math.round(((now - s) / (e - s)) * 100);
};

const daysLeft = (end) => {
  const diff = new Date(end).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

const SkeletonCard = () => (
  <div style={{
    background: "rgba(13,18,30,0.9)", border: "1px solid rgba(51,65,85,0.5)",
    borderRadius: 20, padding: 28, overflow: "hidden",
  }}>
    <div style={{ height: 3, background: "rgba(51,65,85,0.5)", marginBottom: 24 }} />
    {[70, 45, 80, 55, 35].map((w, i) => (
      <div key={i} className="mp-skeleton" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
    ))}
  </div>
);

export default function MyPolicies() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPolicies = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await axios.get("http://127.0.0.1:8000/policies/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPolicies(res.data);
    } catch {
      showToast("error", "Failed to load policies.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const id = confirmId;
    setConfirmId(null);
    try {
      setCancelling(id);
      const token = localStorage.getItem("access_token");
      await axios.put(`http://127.0.0.1:8000/policies/cancel/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("success", "Policy cancelled successfully.");
      fetchPolicies();
    } catch {
      showToast("error", "Cancellation failed. Please try again.");
    } finally {
      setCancelling(null);
    }
  };

  useEffect(() => { fetchPolicies(); }, []);

  const active = policies.filter((p) => p.status === "active").length;
  const totalPremium = policies.reduce((s, p) => s + (p.premium || 0), 0);

  return (
    <>
      <style>{styles}</style>

      {toast && (
        <div className={`mp-toast ${toast.type}`}>
          {toast.type === "success"
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          {toast.msg}
        </div>
      )}

      {confirmId && (
        <div className="mp-modal-backdrop" onClick={() => setConfirmId(null)}>
          <div className="mp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal-icon">⚠️</div>
            <div className="mp-modal-title">Cancel this policy?</div>
            <div className="mp-modal-sub">
              This action cannot be undone. Your coverage will be terminated immediately and you may not be eligible for a refund.
            </div>
            <div className="mp-modal-actions">
              <button className="mp-modal-cancel" onClick={() => setConfirmId(null)}>Keep Policy</button>
              <button className="mp-modal-confirm" onClick={handleCancel}>
                Yes, Cancel It
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mp-root">
        <div className="mp-bg-grid" />
        <div className="mp-glow-1" />
        <div className="mp-glow-2" />

        <div className="mp-inner">

          {/* Header */}
          <div className="mp-header">
            <div className="mp-eyebrow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Policy Vault
            </div>
            <h1 className="mp-title">My Policies</h1>
            <p className="mp-subtitle">Manage and track all your active insurance policies in one place.</p>
          </div>

          {/* Stats */}
          {!loading && policies.length > 0 && (
            <div className="mp-stats">
              <div className="mp-stat">
                <div className="mp-stat-val">{policies.length}</div>
                <div className="mp-stat-key">Total Policies</div>
              </div>
              <div className="mp-stat">
                <div className="mp-stat-val" style={{ color: "#34d399" }}>{active}</div>
                <div className="mp-stat-key">Active</div>
              </div>
              <div className="mp-stat">
                <div className="mp-stat-val">
                  {totalPremium >= 100000 ? `₹${(totalPremium / 100000).toFixed(1)}L` : `₹${(totalPremium / 1000).toFixed(0)}K`}
                </div>
                <div className="mp-stat-key">Total Premium</div>
              </div>
              <div className="mp-stat">
                <div className="mp-stat-val">{policies.length - active}</div>
                <div className="mp-stat-key">Inactive</div>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="mp-grid">
              {[1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : policies.length === 0 ? (
            <div className="mp-empty">
              <div className="mp-empty-icon">🛡️</div>
              <div className="mp-empty-title">No policies yet</div>
              <div className="mp-empty-sub">Browse recommendations to find a plan that fits your needs.</div>
            </div>
          ) : (
            <div className="mp-grid">
              {policies.map((p, idx) => {
                const status = p.status || "active";
                const progress = calcProgress(p.start_date, p.end_date);
                const remaining = daysLeft(p.end_date);
                const icon = TYPE_ICONS[p.policy?.policy_type] || "📋";

                return (
                  <div
                    key={p.id}
                    className={`mp-card ${status}`}
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <div className={`mp-card-bar`} />
                    <div className="mp-card-body">

                      {/* Top row */}
                      <div className="mp-card-top">
                        <div className="mp-card-left">
                          <div className="mp-policy-name">
                            {icon} {p.policy?.title || `Policy #${p.id}`}
                          </div>
                          <div className="mp-policy-num">
                            <div className="mp-policy-num-dot" />
                            {p.policy_number}
                          </div>
                        </div>

                        <div className={`mp-status ${status}`}>
                          <div className="mp-status-dot" />
                          {status}
                        </div>
                      </div>

                      <div className="mp-card-divider" />

                      {/* Meta */}
                      <div className="mp-meta">
                        <div className="mp-meta-item">
                          <div className="mp-meta-label">Premium</div>
                          <div className="mp-meta-val">₹{p.premium?.toLocaleString("en-IN")}</div>
                        </div>
                        <div className="mp-meta-item">
                          <div className="mp-meta-label">Type</div>
                          <div className="mp-meta-val" style={{ textTransform: "capitalize" }}>
                            {p.policy?.policy_type || "—"}
                          </div>
                        </div>
                        <div className="mp-meta-item">
                          <div className="mp-meta-label">Days Left</div>
                          <div className="mp-meta-val" style={{
                            color: remaining < 30 ? "#f87171" : remaining < 90 ? "#fbbf24" : "#34d399"
                          }}>
                            {status === "active" ? remaining : "—"}
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="mp-dates">
                        <div className="mp-date-item">
                          <div className="mp-date-label">Start Date</div>
                          <div className="mp-date-val">{fmtDate(p.start_date)}</div>
                        </div>
                        <div className="mp-date-sep">→</div>
                        <div className="mp-date-item">
                          <div className="mp-date-label">End Date</div>
                          <div className="mp-date-val">{fmtDate(p.end_date)}</div>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mp-progress-wrap">
                        <div className="mp-progress-label">
                          <span>Coverage Period</span>
                          <span>{progress}% elapsed</span>
                        </div>
                        <div className="mp-progress-track">
                          <div
                            className={`mp-progress-fill ${status !== "active" ? status : ""}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer */}
                      {status === "active" && (
                        <div className="mp-card-footer">
                          <button
                            className="mp-cancel-btn"
                            disabled={cancelling === p.id}
                            onClick={() => setConfirmId(p.id)}
                          >
                            {cancelling === p.id ? (
                              <>
                                <svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                                </svg>
                                Cancel Policy
                              </>
                            )}
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </>
  );
}