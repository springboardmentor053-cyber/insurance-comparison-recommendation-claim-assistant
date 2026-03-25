import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const styles = `
  ${FONTS}

  .mc-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .mc-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #080c14;
    color: #e2e8f0;
    padding: 48px 24px 80px;
    position: relative;
    overflow-x: hidden;
  }

  .mc-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }

  .mc-glow-1 {
    position: fixed; top: -180px; right: -180px;
    width: 520px; height: 520px;
    background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .mc-glow-2 {
    position: fixed; bottom: -200px; left: -150px;
    width: 460px; height: 460px;
    background: radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .mc-inner {
    position: relative; z-index: 1;
    max-width: 860px; margin: 0 auto;
  }

  /* ── HEADER ── */
  .mc-header {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px;
    margin-bottom: 36px;
    flex-wrap: wrap;
  }

  .mc-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px;
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.25);
    border-radius: 100px;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: #fbbf24;
    margin-bottom: 14px;
  }

  .mc-title {
    font-size: 30px; font-weight: 700;
    letter-spacing: -0.025em; color: #f1f5f9;
    line-height: 1.15; margin-bottom: 8px;
  }

  .mc-subtitle { font-size: 13.5px; color: #64748b; line-height: 1.6; }

  /* ── FILE CLAIM BUTTON ── */
  .mc-file-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px;
    background: linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.08));
    border: 1px solid rgba(245,158,11,0.35);
    border-radius: 14px;
    color: #fbbf24; font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 700;
    cursor: pointer; transition: all 0.2s;
    white-space: nowrap; flex-shrink: 0;
    align-self: flex-start; margin-top: 4px;
  }

  .mc-file-btn:hover {
    background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.15));
    border-color: rgba(245,158,11,0.55);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(245,158,11,0.15);
  }

  /* ── STATS ── */
  .mc-stats {
    display: flex; gap: 1px;
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.15);
    border-radius: 16px; overflow: hidden;
    margin-bottom: 36px;
  }

  .mc-stat {
    flex: 1; background: rgba(10,14,24,0.95);
    padding: 16px 20px; text-align: center;
  }

  .mc-stat-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px; font-weight: 600;
    color: #f1f5f9; margin-bottom: 4px;
  }

  .mc-stat-key {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em; color: #475569;
  }

  /* ── SKELETON ── */
  .mc-skeleton {
    background: linear-gradient(90deg, rgba(30,41,59,0.8) 25%, rgba(51,65,85,0.5) 50%, rgba(30,41,59,0.8) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 10px; height: 14px; margin-bottom: 10px;
  }
  @keyframes shimmer { to { background-position: -200% 0; } }

  /* ── EMPTY ── */
  .mc-empty {
    text-align: center; padding: 80px 20px;
    border: 1px dashed rgba(245,158,11,0.2);
    border-radius: 20px; background: rgba(10,14,24,0.5);
  }

  .mc-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .mc-empty-title { font-size: 18px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
  .mc-empty-sub { font-size: 13px; color: #475569; margin-bottom: 24px; }

  /* ── GRID ── */
  .mc-grid { display: flex; flex-direction: column; gap: 16px; }

  /* ── CARD ── */
  .mc-card {
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

  .mc-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 48px rgba(0,0,0,0.4);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .mc-card-bar { height: 3px; }

  .mc-card-body { padding: 26px 28px; }

  /* top row */
  .mc-card-top {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px;
    margin-bottom: 20px; flex-wrap: wrap;
  }

  .mc-claim-number {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px; color: #475569; font-weight: 500;
    margin-bottom: 6px;
    display: flex; align-items: center; gap: 6px;
  }

  .mc-claim-type {
    font-size: 19px; font-weight: 700;
    letter-spacing: -0.02em; color: #f1f5f9;
    text-transform: capitalize;
  }

  /* status badge */
  .mc-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 6px 14px; border-radius: 100px;
    font-size: 11.5px; font-weight: 700;
    text-transform: capitalize; letter-spacing: 0.03em;
    flex-shrink: 0;
  }

  .mc-badge-dot { width: 6px; height: 6px; border-radius: 50%; }

  .mc-badge.draft        { background: rgba(100,116,139,0.15); border: 1px solid rgba(100,116,139,0.3); color: #94a3b8; }
  .mc-badge.submitted    { background: rgba(99,102,241,0.12);  border: 1px solid rgba(99,102,241,0.3);  color: #818cf8; }
  .mc-badge.under_review { background: rgba(168,85,247,0.12);  border: 1px solid rgba(168,85,247,0.3);  color: #c084fc; }
  .mc-badge.approved     { background: rgba(52,211,153,0.1);   border: 1px solid rgba(52,211,153,0.3);  color: #34d399; }
  .mc-badge.rejected     { background: rgba(239,68,68,0.1);    border: 1px solid rgba(239,68,68,0.25);  color: #f87171; }
  .mc-badge.paid         { background: rgba(245,158,11,0.1);   border: 1px solid rgba(245,158,11,0.25); color: #fbbf24; }

  .mc-badge.draft .mc-badge-dot        { background: #94a3b8; }
  .mc-badge.submitted .mc-badge-dot    { background: #818cf8; box-shadow: 0 0 6px #818cf8; animation: pulse 2s infinite; }
  .mc-badge.under_review .mc-badge-dot { background: #c084fc; box-shadow: 0 0 6px #c084fc; animation: pulse 2s infinite; }
  .mc-badge.approved .mc-badge-dot     { background: #34d399; }
  .mc-badge.rejected .mc-badge-dot     { background: #f87171; }
  .mc-badge.paid .mc-badge-dot         { background: #fbbf24; }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* divider */
  .mc-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent);
    margin-bottom: 20px;
  }

  /* meta grid */
  .mc-meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px; margin-bottom: 20px;
  }

  .mc-meta-item {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.6);
    border-radius: 12px; padding: 12px 14px;
  }

  .mc-meta-label {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #475569; margin-bottom: 5px;
  }

  .mc-meta-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px; font-weight: 600; color: #e2e8f0;
  }

  /* ── STATUS TIMELINE (visual dots) ── */
  .mc-timeline {
    display: flex; align-items: center;
    gap: 0; margin-bottom: 20px;
    padding: 14px 18px;
    background: rgba(15,23,42,0.6);
    border: 1px solid rgba(51,65,85,0.5);
    border-radius: 12px;
    overflow-x: auto;
  }

  .mc-tl-step {
    display: flex; flex-direction: column; align-items: center;
    gap: 6px; flex-shrink: 0;
  }

  .mc-tl-dot {
    width: 10px; height: 10px; border-radius: 50%;
    border: 2px solid rgba(51,65,85,0.8);
    background: rgba(15,23,42,0.9);
    transition: all 0.3s;
  }

  .mc-tl-dot.done    { background: #6366f1; border-color: #6366f1; box-shadow: 0 0 8px rgba(99,102,241,0.5); }
  .mc-tl-dot.current { background: #f59e0b; border-color: #f59e0b; box-shadow: 0 0 10px rgba(245,158,11,0.6); animation: pulse 1.5s infinite; }

  .mc-tl-label {
    font-size: 9.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.07em;
    color: #475569; text-align: center;
  }

  .mc-tl-label.done    { color: #6366f1; }
  .mc-tl-label.current { color: #f59e0b; }

  .mc-tl-line {
    flex: 1; height: 2px; min-width: 24px;
    background: rgba(51,65,85,0.5);
    margin-bottom: 16px; border-radius: 2px;
    transition: background 0.3s;
  }

  .mc-tl-line.done { background: linear-gradient(90deg, #6366f1, #8b5cf6); }

  /* ── HISTORY TIMELINE (vertical with timestamps) ── */
  .mc-history {
    margin-bottom: 20px;
    padding: 16px 18px;
    background: rgba(15,23,42,0.5);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 12px;
  }

  .mc-history-title {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 14px;
    display: flex; align-items: center; gap: 6px;
  }

  .mc-history-list {
    display: flex; flex-direction: column; gap: 0;
  }

  .mc-history-item {
    display: flex; align-items: flex-start; gap: 12px;
    position: relative;
  }

  .mc-history-item:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 7px; top: 18px;
    width: 2px; height: calc(100% + 2px);
    background: rgba(99,102,241,0.15);
  }

  .mc-history-dot {
    width: 16px; height: 16px; border-radius: 50%;
    flex-shrink: 0; margin-top: 2px;
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; font-weight: 700;
    border: 2px solid;
    position: relative; z-index: 1;
  }

  .mc-history-content {
    flex: 1; padding-bottom: 14px;
  }

  .mc-history-status {
    font-size: 12.5px; font-weight: 700;
    text-transform: capitalize; margin-bottom: 2px;
  }

  .mc-history-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px; color: #475569;
  }

  /* footer */
  .mc-card-footer {
    display: flex; align-items: center;
    justify-content: space-between; gap: 10px;
    padding-top: 16px;
    border-top: 1px solid rgba(51,65,85,0.5);
    flex-wrap: wrap;
  }

  .mc-docs-count {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: #475569;
  }

  .mc-view-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px;
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 10px;
    color: #818cf8; font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }

  .mc-view-btn:hover {
    background: rgba(99,102,241,0.15);
    border-color: rgba(99,102,241,0.4);
    transform: translateY(-1px);
  }

  /* toast */
  .mc-toast {
    position: fixed; top: 24px; right: 24px; z-index: 100;
    padding: 13px 20px; border-radius: 14px;
    display: flex; align-items: center; gap: 9px;
    font-size: 13.5px; font-weight: 600; font-family: 'Sora', sans-serif;
    animation: slideIn 0.3s ease;
    box-shadow: 0 16px 40px rgba(0,0,0,0.4);
  }

  .mc-toast.error { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #f87171; }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  @media (max-width: 600px) {
    .mc-meta { grid-template-columns: 1fr 1fr; }
    .mc-card-top { flex-direction: column; }
  }
`;

const STATUS_BAR = {
  draft:        'linear-gradient(90deg, #475569, #64748b)',
  submitted:    'linear-gradient(90deg, #6366f1, #8b5cf6)',
  under_review: 'linear-gradient(90deg, #8b5cf6, #a855f7)',
  approved:     'linear-gradient(90deg, #10b981, #34d399)',
  rejected:     'linear-gradient(90deg, #ef4444, #f87171)',
  paid:         'linear-gradient(90deg, #f59e0b, #fbbf24)',
};

// Colors for each status in history
const STATUS_HISTORY_COLORS = {
  draft:        { color: '#94a3b8', border: 'rgba(100,116,139,0.4)', bg: 'rgba(100,116,139,0.1)' },
  submitted:    { color: '#818cf8', border: 'rgba(99,102,241,0.4)',  bg: 'rgba(99,102,241,0.1)'  },
  under_review: { color: '#c084fc', border: 'rgba(168,85,247,0.4)',  bg: 'rgba(168,85,247,0.1)'  },
  approved:     { color: '#34d399', border: 'rgba(52,211,153,0.4)',  bg: 'rgba(52,211,153,0.1)'  },
  rejected:     { color: '#f87171', border: 'rgba(239,68,68,0.4)',   bg: 'rgba(239,68,68,0.1)'   },
  paid:         { color: '#fbbf24', border: 'rgba(245,158,11,0.4)',  bg: 'rgba(245,158,11,0.1)'  },
};

const TIMELINE_STEPS  = ['draft', 'submitted', 'under_review', 'approved', 'paid'];
const TIMELINE_LABELS = {
  draft: 'Draft', submitted: 'Submitted',
  under_review: 'In Review', approved: 'Approved', paid: 'Paid',
};
const STATUS_ORDER = ['draft', 'submitted', 'under_review', 'approved', 'paid'];

const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const fmtAmount = (n) => {
  if (!n) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
};

const SkeletonCard = () => (
  <div style={{
    background: 'rgba(13,18,30,0.9)', border: '1px solid rgba(51,65,85,0.5)',
    borderRadius: 20, padding: 28, overflow: 'hidden',
  }}>
    <div style={{ height: 3, background: 'rgba(51,65,85,0.5)', marginBottom: 24 }} />
    {[70, 45, 80, 55, 35].map((w, i) => (
      <div key={i} className="mc-skeleton" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
    ))}
  </div>
);

export default function MyClaims() {
  const navigate = useNavigate();
  const [claims, setClaims]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState(null);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchClaims = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://127.0.0.1:8000/claims', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClaims(res.data);
    } catch {
      showToast('error', 'Failed to load claims.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const total    = claims.length;
  const open     = claims.filter((c) => ['submitted', 'under_review'].includes(c.status)).length;
  const approved = claims.filter((c) => c.status === 'approved' || c.status === 'paid').length;
  const drafts   = claims.filter((c) => c.status === 'draft').length;

  return (
    <>
      <style>{styles}</style>

      {toast && (
        <div className={`mc-toast ${toast.type}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {toast.msg}
        </div>
      )}

      <div className="mc-root">
        <div className="mc-bg-grid" />
        <div className="mc-glow-1" />
        <div className="mc-glow-2" />

        <div className="mc-inner">

          {/* Header */}
          <div className="mc-header">
            <div>
              <div className="mc-eyebrow">📁 Claims Centre</div>
              <h1 className="mc-title">My Claims</h1>
              <p className="mc-subtitle">File and track all your insurance claims in one place.</p>
            </div>
            <button className="mc-file-btn" onClick={() => navigate('/claims/file')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              File New Claim
            </button>
          </div>

          {/* Stats */}
          {!loading && claims.length > 0 && (
            <div className="mc-stats">
              <div className="mc-stat">
                <div className="mc-stat-val">{total}</div>
                <div className="mc-stat-key">Total Claims</div>
              </div>
              <div className="mc-stat">
                <div className="mc-stat-val" style={{ color: '#818cf8' }}>{open}</div>
                <div className="mc-stat-key">Under Review</div>
              </div>
              <div className="mc-stat">
                <div className="mc-stat-val" style={{ color: '#34d399' }}>{approved}</div>
                <div className="mc-stat-key">Approved</div>
              </div>
              <div className="mc-stat">
                <div className="mc-stat-val" style={{ color: '#94a3b8' }}>{drafts}</div>
                <div className="mc-stat-key">Drafts</div>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="mc-grid">
              {[1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          ) : claims.length === 0 ? (
            <div className="mc-empty">
              <div className="mc-empty-icon">📋</div>
              <div className="mc-empty-title">No claims yet</div>
              <div className="mc-empty-sub">File a claim against one of your active policies.</div>
              <button className="mc-file-btn" onClick={() => navigate('/claims/file')}>
                + File Your First Claim
              </button>
            </div>
          ) : (
            <div className="mc-grid">
              {claims.map((claim, idx) => {
                const status     = claim.status || 'draft';
                const isRejected = status === 'rejected';
                const history    = claim.status_history || [];

                const currentIdx = isRejected
                  ? STATUS_ORDER.indexOf('under_review')
                  : STATUS_ORDER.indexOf(status);

                return (
                  <div
                    key={claim.id}
                    className="mc-card"
                    style={{
                      animationDelay: `${idx * 0.08}s`,
                      borderColor: status === 'approved' || status === 'paid'
                        ? 'rgba(52,211,153,0.25)'
                        : status === 'rejected'
                        ? 'rgba(239,68,68,0.2)'
                        : 'rgba(51,65,85,0.7)',
                    }}
                  >
                    {/* Accent bar */}
                    <div className="mc-card-bar" style={{ background: STATUS_BAR[status] || STATUS_BAR.draft }} />

                    <div className="mc-card-body">

                      {/* Top row */}
                      <div className="mc-card-top">
                        <div>
                          <div className="mc-claim-number">
                            <span style={{ color: '#334155' }}>●</span>
                            {claim.claim_number || `CLM-${String(claim.id).padStart(5, '0')}`}
                          </div>
                          <div className="mc-claim-type">
                            📝 {claim.claim_type || 'General Claim'}
                          </div>
                        </div>
                        <div className={`mc-badge ${status}`}>
                          <div className="mc-badge-dot" />
                          {status.replace('_', ' ')}
                        </div>
                      </div>

                      <div className="mc-divider" />

                      {/* Meta */}
                      <div className="mc-meta">
                        <div className="mc-meta-item">
                          <div className="mc-meta-label">Amount Claimed</div>
                          <div className="mc-meta-val">{fmtAmount(claim.amount_claimed)}</div>
                        </div>
                        <div className="mc-meta-item">
                          <div className="mc-meta-label">Incident Date</div>
                          <div className="mc-meta-val">{fmtDate(claim.incident_date)}</div>
                        </div>
                        <div className="mc-meta-item">
                          <div className="mc-meta-label">Filed On</div>
                          <div className="mc-meta-val">{fmtDate(claim.created_at)}</div>
                        </div>
                      </div>

                      {/* Visual Progress Timeline */}
                      {!isRejected ? (
                        <div className="mc-timeline">
                          {TIMELINE_STEPS.map((step, i) => {
                            const isDone    = i < currentIdx;
                            const isCurrent = i === currentIdx;
                            const isLast    = i === TIMELINE_STEPS.length - 1;
                            return (
                              <div key={step} style={{ display: 'flex', alignItems: 'center', flex: isLast ? '0' : '1' }}>
                                <div className="mc-tl-step">
                                  <div className={`mc-tl-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`} />
                                  <div className={`mc-tl-label ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                                    {TIMELINE_LABELS[step]}
                                  </div>
                                </div>
                                {!isLast && <div className={`mc-tl-line ${isDone ? 'done' : ''}`} />}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{
                          padding: '12px 16px',
                          background: 'rgba(239,68,68,0.06)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: 12, marginBottom: 20,
                          fontSize: 13, color: '#f87171',
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}>
                          <span>✕</span> This claim was reviewed and rejected.
                        </div>
                      )}

                      {/* ── History Timeline with real timestamps ── */}
                      {history.length > 0 && (
                        <div className="mc-history">
                          <div className="mc-history-title">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Status History
                          </div>
                          <div className="mc-history-list">
                            {history.map((entry, i) => {
                              const meta = STATUS_HISTORY_COLORS[entry.status] || STATUS_HISTORY_COLORS.draft;
                              return (
                                <div key={entry.id || i} className="mc-history-item">
                                  <div
                                    className="mc-history-dot"
                                    style={{
                                      background: meta.bg,
                                      borderColor: meta.border,
                                      color: meta.color,
                                    }}
                                  >✓</div>
                                  <div className="mc-history-content">
                                    <div className="mc-history-status" style={{ color: meta.color }}>
                                      {entry.status.replace(/_/g, ' ')}
                                    </div>
                                    <div className="mc-history-time">
                                      {fmtDateTime(entry.changed_at)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="mc-card-footer">
                        <div className="mc-docs-count">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          </svg>
                          {claim.documents?.length || 0} document{claim.documents?.length !== 1 ? 's' : ''} attached
                        </div>
                        {status === 'draft' && (
                          <button
                            className="mc-view-btn"
                            onClick={() => navigate(`/claims/file?claim_id=${claim.id}`)}
                            style={{ borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24', background: 'rgba(245,158,11,0.08)' }}
                          >
                            Continue Draft
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </button>
                        )}
                      </div>

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