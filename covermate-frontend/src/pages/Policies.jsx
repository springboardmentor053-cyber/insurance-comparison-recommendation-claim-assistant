import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolicies } from '../services/policyService';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const styles = `
  ${FONTS}

  .pl-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .pl-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #080c14;
    color: #e2e8f0;
    padding: 48px 24px 100px;
    position: relative;
    overflow-x: hidden;
  }

  .pl-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.032) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.032) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }

  .pl-glow-1 {
    position: fixed; top: -180px; right: -180px;
    width: 540px; height: 540px;
    background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .pl-glow-2 {
    position: fixed; bottom: -180px; left: -140px;
    width: 460px; height: 460px;
    background: radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .pl-inner {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
  }

  .pl-header { margin-bottom: 32px; animation: fadeUp 0.4s ease both; }

  .pl-title {
    font-size: 30px; font-weight: 700;
    letter-spacing: -0.025em; color: #f1f5f9;
    line-height: 1.15; margin-bottom: 8px;
  }

  .pl-title-accent {
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .pl-subtitle { font-size: 13.5px; color: #64748b; }

  .pl-filters {
    display: flex; gap: 8px; flex-wrap: wrap;
    margin-bottom: 28px;
    animation: fadeUp 0.4s ease 0.06s both;
  }

  .pl-filter-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 9px 16px;
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.7);
    border-radius: 100px;
    color: #64748b; font-family: 'Sora', sans-serif;
    font-size: 12.5px; font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pl-filter-btn:hover { border-color: rgba(99,102,241,0.35); color: #94a3b8; }

  .pl-filter-btn.active {
    background: rgba(99,102,241,0.15);
    border-color: rgba(99,102,241,0.4);
    color: #a5b4fc;
    box-shadow: 0 0 16px rgba(99,102,241,0.12);
  }

  .pl-filter-count {
    background: rgba(99,102,241,0.2);
    color: #818cf8; font-size: 10px; font-weight: 700;
    padding: 1px 6px; border-radius: 100px;
    font-family: 'JetBrains Mono', monospace;
  }

  .pl-toolbar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; gap: 12px; flex-wrap: wrap;
    animation: fadeUp 0.4s ease 0.1s both;
  }

  .pl-results-count {
    font-size: 12px; color: #475569; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.07em;
  }

  .pl-sort { display: flex; align-items: center; gap: 8px; }
  .pl-sort-label { font-size: 12px; color: #475569; }

  .pl-sort-select {
    padding: 7px 12px;
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.7);
    border-radius: 9px;
    color: #94a3b8; font-family: 'Sora', sans-serif;
    font-size: 12px; outline: none; cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24'%3E%3Cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    padding-right: 28px;
  }

  .pl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    animation: fadeUp 0.4s ease 0.14s both;
  }

  .pl-card {
    background: rgba(13,18,30,0.92);
    border: 1px solid rgba(51,65,85,0.65);
    border-radius: 20px;
    overflow: hidden;
    backdrop-filter: blur(14px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    transition: border-color 0.25s, box-shadow 0.2s, transform 0.2s;
    position: relative;
  }

  .pl-card:hover {
    border-color: rgba(99,102,241,0.3);
    transform: translateY(-2px);
    box-shadow: 0 10px 40px rgba(0,0,0,0.35), 0 0 24px rgba(99,102,241,0.06);
  }

  .pl-card.selected {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 1px rgba(99,102,241,0.15), 0 10px 40px rgba(99,102,241,0.1);
  }

  .pl-card-bar { height: 3px; }
  .pl-card-body { padding: 22px 24px; }

  .pl-card-top {
    display: flex; align-items: flex-start;
    justify-content: space-between; margin-bottom: 16px; gap: 10px;
  }

  .pl-type-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 10.5px; font-weight: 700;
    text-transform: capitalize; letter-spacing: 0.04em;
  }

  .pl-compare-toggle {
    display: flex; align-items: center; gap: 6px;
    cursor: pointer; padding: 4px 10px;
    border-radius: 100px;
    border: 1px solid rgba(51,65,85,0.6);
    background: rgba(15,23,42,0.6);
    font-size: 11px; font-weight: 600; color: #64748b;
    transition: all 0.2s;
    user-select: none;
  }

  .pl-compare-toggle:hover { border-color: rgba(99,102,241,0.4); color: #94a3b8; }

  .pl-compare-toggle.checked {
    border-color: rgba(99,102,241,0.5);
    background: rgba(99,102,241,0.12);
    color: #a5b4fc;
  }

  .pl-compare-box {
    width: 14px; height: 14px; border-radius: 4px;
    border: 1.5px solid #334155;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s; flex-shrink: 0;
  }

  .pl-compare-toggle.checked .pl-compare-box {
    background: #6366f1; border-color: #6366f1;
  }

  .pl-card-title {
    font-size: 16.5px; font-weight: 700;
    letter-spacing: -0.02em; color: #f1f5f9;
    margin-bottom: 14px;
  }

  .pl-card-metrics {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 9px; margin-bottom: 16px;
  }

  .pl-metric {
    background: rgba(15,23,42,0.7);
    border: 1px solid rgba(51,65,85,0.55);
    border-radius: 10px; padding: 10px 12px;
  }

  .pl-metric-label {
    font-size: 9.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #475569; margin-bottom: 4px;
  }

  .pl-metric-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; font-weight: 600; color: #e2e8f0;
  }

  .pl-cov-toggle {
    display: flex; align-items: center; gap: 7px;
    font-size: 12px; font-weight: 600; color: #6366f1;
    background: none; border: none; cursor: pointer;
    padding: 0; transition: color 0.2s; margin-bottom: 10px;
    font-family: 'Sora', sans-serif;
  }

  .pl-cov-toggle:hover { color: #818cf8; }

  .pl-cov-grid { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }

  .pl-cov-row {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    background: rgba(15,23,42,0.5);
    border: 1px solid rgba(51,65,85,0.4);
    border-radius: 8px;
    font-size: 11.5px;
  }

  .pl-cov-key { color: #94a3b8; text-transform: capitalize; }
  .pl-cov-val-yes { color: #34d399; font-weight: 600; }
  .pl-cov-val-no  { color: #f87171; font-weight: 600; }
  .pl-cov-val-neutral { color: #94a3b8; font-family: 'JetBrains Mono', monospace; }

  .pl-card-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent);
    margin-bottom: 14px;
  }

  .pl-quote-btn {
    width: 100%;
    padding: 12px;
    border: none; border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 700;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: opacity 0.2s, transform 0.15s;
    box-shadow: 0 4px 16px rgba(99,102,241,0.25);
    position: relative; overflow: hidden;
  }

  .pl-quote-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
    pointer-events: none;
  }

  .pl-quote-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  /* ── SKELETON ── */
  .pl-skeleton {
    background: linear-gradient(90deg, rgba(30,41,59,0.8) 25%, rgba(51,65,85,0.5) 50%, rgba(30,41,59,0.8) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 10px; height: 14px; margin-bottom: 10px;
  }

  @keyframes shimmer { to { background-position: -200% 0; } }

  /* ── COMPARE BAR ── */
  .pl-compare-bar {
    position: fixed; bottom: 0; left: 0; right: 0;
    z-index: 50;
    background: rgba(13,18,30,0.97);
    border-top: 1px solid rgba(99,102,241,0.25);
    backdrop-filter: blur(20px);
    padding: 16px 24px;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.4);
    animation: slideUp 0.3s ease;
  }

  @keyframes slideUp {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0); opacity: 1; }
  }

  .pl-compare-bar-left {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }

  .pl-compare-bar-label { font-size: 13px; color: #94a3b8; font-weight: 600; }
  .pl-compare-chips { display: flex; gap: 8px; flex-wrap: wrap; }

  .pl-compare-chip {
    display: flex; align-items: center; gap: 7px;
    padding: 6px 12px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 100px;
    font-size: 12px; font-weight: 600; color: #a5b4fc;
  }

  .pl-compare-chip-remove {
    background: none; border: none; cursor: pointer;
    color: #6366f1; padding: 0; display: flex; align-items: center;
    transition: color 0.15s;
  }

  .pl-compare-chip-remove:hover { color: #f87171; }

  .pl-compare-go-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none; border-radius: 12px;
    color: #fff; font-family: 'Sora', sans-serif;
    font-size: 14px; font-weight: 700;
    cursor: pointer; white-space: nowrap;
    box-shadow: 0 4px 20px rgba(99,102,241,0.35);
    display: flex; align-items: center; gap: 8px;
    transition: opacity 0.2s, transform 0.15s;
  }

  .pl-compare-go-btn:hover { opacity: 0.9; transform: translateY(-1px); }

  .pl-empty {
    text-align: center; padding: 80px 20px;
    border: 1px dashed rgba(99,102,241,0.2);
    border-radius: 20px; background: rgba(10,14,24,0.5);
  }

  .pl-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .pl-empty-title { font-size: 18px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
  .pl-empty-sub { font-size: 13px; color: #475569; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 600px) {
    .pl-card-metrics { grid-template-columns: 1fr 1fr; }
    .pl-compare-bar { flex-direction: column; align-items: stretch; }
    .pl-compare-go-btn { justify-content: center; }
  }
`;

const TYPE_FILTERS = [
  { key: 'all',    label: 'All Plans', icon: '📋' },
  { key: 'health', label: 'Health',    icon: '🏥' },
  { key: 'life',   label: 'Life',      icon: '💚' },
  { key: 'auto',   label: 'Auto',      icon: '🚗' },
  { key: 'home',   label: 'Home',      icon: '🏠' },
  { key: 'travel', label: 'Travel',    icon: '✈️' },
];

const TYPE_COLORS = {
  health: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#34d399', bar: 'linear-gradient(90deg,#10b981,#34d399)' },
  life:   { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#818cf8', bar: 'linear-gradient(90deg,#6366f1,#8b5cf6)' },
  auto:   { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.3)',  text: '#22d3ee', bar: 'linear-gradient(90deg,#06b6d4,#0ea5e9)' },
  home:   { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fbbf24', bar: 'linear-gradient(90deg,#f59e0b,#f97316)' },
  travel: { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', text: '#c084fc', bar: 'linear-gradient(90deg,#a855f7,#ec4899)' },
};

const TYPE_ICONS = { life: '💚', health: '🏥', auto: '🚗', travel: '✈️', home: '🏠' };

function fmt(amount) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

function fmtTerm(months) {
  if (months >= 12) { const y = months / 12; return y === 1 ? '1 year' : `${y} years`; }
  return months === 1 ? '1 month' : `${months} months`;
}

function SkeletonCard() {
  return (
    <div style={{ background: 'rgba(13,18,30,0.9)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ height: 3, background: 'rgba(51,65,85,0.5)' }} />
      <div style={{ padding: '22px 24px' }}>
        {[60, 80, 45, 70, 55].map((w, i) => (
          <div key={i} className="pl-skeleton" style={{ width: `${w}%`, animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}

export default function Policies() {
  const navigate = useNavigate();
  const [policies, setPolicies]   = useState([]);
  const [filter,   setFilter]     = useState('all');
  const [sort,     setSort]       = useState('default');
  const [loading,  setLoading]    = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [selected, setSelected]   = useState([]);

  useEffect(() => {
    setLoading(true);
    getPolicies(filter)
      .then((data) => setPolicies(data))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const sorted = [...policies].sort((a, b) => {
    if (sort === 'premium_asc')  return a.premium - b.premium;
    if (sort === 'premium_desc') return b.premium - a.premium;
    if (sort === 'term_asc')     return a.term_months - b.term_months;
    return 0;
  });

  const handleSelect = (policy) => {
    const exists = selected.find((p) => p.id === policy.id);
    if (exists) {
      setSelected(selected.filter((p) => p.id !== policy.id));
    } else {
      if (selected.length >= 3) return;
      setSelected([...selected, policy]);
    }
  };

  const countByType = (key) =>
    key === 'all' ? policies.length : policies.filter((p) => p.policy_type === key).length;

  return (
    <>
      <style>{styles}</style>
      <div className="pl-root">
        <div className="pl-bg-grid" />
        <div className="pl-glow-1" />
        <div className="pl-glow-2" />

        <div className="pl-inner">

          {/* Header */}
          <div className="pl-header">
            <h1 className="pl-title">
              Browse <span className="pl-title-accent">Insurance Policies</span>
            </h1>
            <p className="pl-subtitle">
              Compare plans from India's top insurers and find the right coverage for you.
            </p>
          </div>

          {/* Filters */}
          <div className="pl-filters">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                className={`pl-filter-btn ${filter === f.key ? 'active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.icon} {f.label}
                {!loading && (
                  <span className="pl-filter-count">{countByType(f.key)}</span>
                )}
              </button>
            ))}
          </div>

          {/* Toolbar */}
          {!loading && (
            <div className="pl-toolbar">
              <span className="pl-results-count">
                {sorted.length} plan{sorted.length !== 1 ? 's' : ''} found
              </span>
              <div className="pl-sort">
                <span className="pl-sort-label">Sort by</span>
                <select
                  className="pl-sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="default">Default</option>
                  <option value="premium_asc">Premium: Low → High</option>
                  <option value="premium_desc">Premium: High → Low</option>
                  <option value="term_asc">Term: Short → Long</option>
                </select>
              </div>
            </div>
          )}

          {loading && (
            <div className="pl-grid">
              {[1,2,3,4,5,6].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && sorted.length === 0 && (
            <div className="pl-empty">
              <div className="pl-empty-icon">🔍</div>
              <div className="pl-empty-title">No policies found</div>
              <div className="pl-empty-sub">Try a different category or check back later.</div>
            </div>
          )}

          {/* Grid */}
          {!loading && sorted.length > 0 && (
            <div className="pl-grid">
              {sorted.map((policy, idx) => {
                const isExpanded = expanded === policy.id;
                const isSelected = selected.some((p) => p.id === policy.id);
                const colors     = TYPE_COLORS[policy.policy_type] || TYPE_COLORS.life;
                const icon       = TYPE_ICONS[policy.policy_type]  || '📋';

                return (
                  <div
                    key={policy.id}
                    className={`pl-card ${isSelected ? 'selected' : ''}`}
                    style={{ animationDelay: `${(idx % 9) * 0.05}s`, animation: 'fadeUp 0.4s ease both' }}
                  >
                    <div className="pl-card-bar" style={{ background: colors.bar }} />
                    <div className="pl-card-body">

                      {/* Top row */}
                      <div className="pl-card-top">
                        <div
                          className="pl-type-badge"
                          style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}
                        >
                          {icon} {policy.policy_type}
                        </div>

                        <div
                          className={`pl-compare-toggle ${isSelected ? 'checked' : ''}`}
                          onClick={() => handleSelect(policy)}
                        >
                          <div className="pl-compare-box">
                            {isSelected && (
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </div>
                          Compare
                        </div>
                      </div>

                      <div className="pl-card-title">{policy.title}</div>

                      {/* Metrics */}
                      <div className="pl-card-metrics">
                        <div className="pl-metric">
                          <div className="pl-metric-label">Premium</div>
                          <div className="pl-metric-val">{fmt(policy.premium)}</div>
                        </div>
                        <div className="pl-metric">
                          <div className="pl-metric-label">Term</div>
                          <div className="pl-metric-val">{fmtTerm(policy.term_months)}</div>
                        </div>
                        <div className="pl-metric">
                          <div className="pl-metric-label">Deductible</div>
                          <div
                            className="pl-metric-val"
                            style={{ color: policy.deductible === 0 ? '#34d399' : '#fbbf24' }}
                          >
                            {policy.deductible > 0 ? fmt(policy.deductible) : 'None'}
                          </div>
                        </div>
                      </div>

                      {/* Coverage accordion */}
                      {policy.coverage && Object.keys(policy.coverage).length > 0 && (
                        <>
                          <button
                            className="pl-cov-toggle"
                            onClick={() => setExpanded(isExpanded ? null : policy.id)}
                          >
                            <svg
                              width="13" height="13" viewBox="0 0 24 24" fill="none"
                              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                              style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                            >
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                            {isExpanded ? 'Hide' : 'Show'} Coverage Details
                          </button>

                          {isExpanded && (
                            <div className="pl-cov-grid">
                              {Object.entries(policy.coverage).map(([key, val]) => (
                                <div className="pl-cov-row" key={key}>
                                  <span className="pl-cov-key">{key.replace(/_/g, ' ')}</span>
                                  {typeof val === 'boolean' ? (
                                    <span className={val ? 'pl-cov-val-yes' : 'pl-cov-val-no'}>
                                      {val
                                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                      }
                                    </span>
                                  ) : (
                                    <span className="pl-cov-val-neutral">{val}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      <div className="pl-card-divider" />

                      <button
                        className="pl-quote-btn"
                        onClick={() =>
                          navigate('/calculator', { state: { policy, allPolicies: sorted } })
                        }
                      >
                        Get Quote
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Compare bar */}
      {selected.length >= 1 && (
        <div className="pl-compare-bar">
          <div className="pl-compare-bar-left">
            <span className="pl-compare-bar-label">
              {selected.length}/3 selected
            </span>
            <div className="pl-compare-chips">
              {selected.map((p) => (
                <div key={p.id} className="pl-compare-chip">
                  {TYPE_ICONS[p.policy_type] || '📋'} {p.title}
                  <button
                    className="pl-compare-chip-remove"
                    onClick={() => setSelected(selected.filter((s) => s.id !== p.id))}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            className="pl-compare-go-btn"
            disabled={selected.length < 2}
            onClick={() => navigate('/compare', { state: { policies: selected } })}
            style={{ opacity: selected.length < 2 ? 0.5 : 1, cursor: selected.length < 2 ? 'not-allowed' : 'pointer' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6"  y1="20" x2="6"  y2="14"/>
            </svg>
            Compare {selected.length >= 2 ? `(${selected.length})` : '— select 2+'}
          </button>
        </div>
      )}
    </>
  );
}