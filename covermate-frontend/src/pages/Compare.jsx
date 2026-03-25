import { useLocation } from "react-router-dom";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const styles = `
  ${FONTS}

  .cmp-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .cmp-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #080c14;
    color: #e2e8f0;
    padding: 48px 24px 80px;
    position: relative;
    overflow-x: hidden;
  }

  .cmp-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.032) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.032) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }

  .cmp-glow-1 {
    position: fixed; top: -200px; right: -200px;
    width: 560px; height: 560px;
    background: radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .cmp-glow-2 {
    position: fixed; bottom: -180px; left: -140px;
    width: 460px; height: 460px;
    background: radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .cmp-inner {
    position: relative; z-index: 1;
    max-width: 1060px; margin: 0 auto;
  }

  /* ── HEADER ── */
  .cmp-header { margin-bottom: 36px; animation: fadeUp 0.4s ease both; }

  .cmp-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 100px;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: #818cf8; margin-bottom: 14px;
  }

  .cmp-title {
    font-size: 30px; font-weight: 700;
    letter-spacing: -0.025em; color: #f1f5f9;
    line-height: 1.15; margin-bottom: 8px;
  }

  .cmp-subtitle { font-size: 13.5px; color: #64748b; }

  /* ── WINNER BANNER ── */
  .cmp-winner {
    display: flex; align-items: center; gap: 14px;
    padding: 16px 22px;
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 16px; margin-bottom: 28px;
    animation: fadeUp 0.4s ease 0.06s both;
  }

  .cmp-winner-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
  }

  .cmp-winner-text { font-size: 13px; color: #94a3b8; }
  .cmp-winner-name { font-weight: 700; color: #a5b4fc; }

  /* ── GRID ── */
  .cmp-grid {
    display: grid;
    gap: 16px;
    animation: fadeUp 0.4s ease 0.1s both;
  }

  /* ── CARD ── */
  .cmp-card {
    background: rgba(13,18,30,0.92);
    border: 1px solid rgba(51,65,85,0.7);
    border-radius: 20px;
    overflow: hidden;
    backdrop-filter: blur(14px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    transition: border-color 0.25s, box-shadow 0.2s;
    position: relative;
  }

  .cmp-card.best {
    border-color: rgba(99,102,241,0.4);
    box-shadow: 0 0 0 1px rgba(99,102,241,0.12), 0 12px 48px rgba(99,102,241,0.1);
  }

  .cmp-card-bar {
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
  }

  .cmp-card.card-1 .cmp-card-bar { background: linear-gradient(90deg, #6366f1, #8b5cf6); }
  .cmp-card.card-2 .cmp-card-bar { background: linear-gradient(90deg, #06b6d4, #0ea5e9); }
  .cmp-card.card-3 .cmp-card-bar { background: linear-gradient(90deg, #22c55e, #16a34a); }

  .cmp-card-body { padding: 24px 26px; }

  /* card header */
  .cmp-card-head {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 12px;
    margin-bottom: 20px;
  }

  .cmp-card-title {
    font-size: 17px; font-weight: 700;
    letter-spacing: -0.02em; color: #f1f5f9;
    margin-bottom: 4px;
  }

  .cmp-card-type {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11.5px; font-weight: 600;
    color: #64748b; text-transform: capitalize;
  }

  .cmp-type-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #6366f1;
  }

  .cmp-best-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px;
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.3);
    border-radius: 100px;
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: #a5b4fc; white-space: nowrap;
    flex-shrink: 0;
  }

  /* metric row */
  .cmp-metrics {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 10px; margin-bottom: 20px;
  }

  .cmp-metric {
    background: rgba(15,23,42,0.8);
    border: 1px solid rgba(51,65,85,0.6);
    border-radius: 12px; padding: 12px 14px;
  }

  .cmp-metric-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #475569; margin-bottom: 5px;
  }

  .cmp-metric-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px; font-weight: 600; color: #e2e8f0;
  }

  .cmp-metric-val.highlight { color: #a5b4fc; }
  .cmp-metric-val.green { color: #34d399; }
  .cmp-metric-val.amber { color: #fbbf24; }

  /* divider */
  .cmp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent);
    margin-bottom: 18px;
  }

  /* coverage section */
  .cmp-cov-label {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 12px;
  }

  .cmp-cov-grid {
    display: flex; flex-direction: column; gap: 8px;
  }

  .cmp-cov-row {
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
    padding: 9px 12px;
    background: rgba(15,23,42,0.6);
    border: 1px solid rgba(51,65,85,0.5);
    border-radius: 10px;
  }

  .cmp-cov-key {
    font-size: 12px; color: #94a3b8;
    text-transform: capitalize; font-weight: 500;
  }

  .cmp-cov-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 600;
  }

  .cmp-cov-val.yes { color: #34d399; }
  .cmp-cov-val.no { color: #f87171; }
  .cmp-cov-val.neutral { color: #94a3b8; }

  /* ── COMPARE TABLE (side by side rows) ── */
  .cmp-table-section {
    margin-top: 32px;
    animation: fadeUp 0.4s ease 0.18s both;
  }

  .cmp-table-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px;
  }

  .cmp-table-title {
    font-size: 11.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em; color: #475569;
  }

  .cmp-table-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(99,102,241,0.2), transparent);
  }

  .cmp-table {
    background: rgba(13,18,30,0.9);
    border: 1px solid rgba(51,65,85,0.6);
    border-radius: 18px; overflow: hidden;
    backdrop-filter: blur(12px);
  }

  .cmp-table-row {
    display: grid;
    border-bottom: 1px solid rgba(51,65,85,0.4);
  }

  .cmp-table-row:last-child { border-bottom: none; }

  .cmp-table-row.header-row {
    background: rgba(15,23,42,0.8);
  }

  .cmp-table-cell {
    padding: 14px 18px;
    font-size: 13px;
    border-right: 1px solid rgba(51,65,85,0.4);
  }

  .cmp-table-cell:last-child { border-right: none; }

  .cmp-table-cell.row-label {
    font-size: 11.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.07em;
    color: #475569; background: rgba(15,23,42,0.5);
  }

  .cmp-table-cell.col-header {
    font-weight: 700; color: #94a3b8; font-size: 12px;
  }

  .cmp-table-cell.winner-cell {
    background: rgba(99,102,241,0.06);
    color: #a5b4fc; font-weight: 700;
    font-family: 'JetBrains Mono', monospace;
  }

  .cmp-table-cell.normal-cell {
    color: #94a3b8;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── EMPTY ── */
  .cmp-empty {
    text-align: center; padding: 80px 20px;
    border: 1px dashed rgba(99,102,241,0.2);
    border-radius: 20px; background: rgba(10,14,24,0.5);
    margin-top: 20px;
  }

  .cmp-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .cmp-empty-title { font-size: 18px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
  .cmp-empty-sub { font-size: 13px; color: #475569; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 700px) {
    .cmp-metrics { grid-template-columns: 1fr 1fr; }
  }
`;

const TYPE_ICONS = { life: "💚", health: "🏥", auto: "🚗", travel: "✈️", home: "🏠" };
const CARD_CLASSES = ["card-1", "card-2", "card-3"];

function fmt(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(amount);
}

function getBestIdx(policies) {
  // lowest premium is "best value"
  let min = Infinity, idx = 0;
  policies.forEach((p, i) => { if (p.premium < min) { min = p.premium; idx = i; } });
  return idx;
}

export default function Compare() {
  const location = useLocation();
  const policies = location.state?.policies || [];

  if (policies.length < 2) {
    return (
      <>
        <style>{styles}</style>
        <div className="cmp-root">
          <div className="cmp-bg-grid" /><div className="cmp-glow-1" /><div className="cmp-glow-2" />
          <div className="cmp-inner">
            <div className="cmp-header">
              <h1 className="cmp-title">Policy Comparison</h1>
            </div>
            <div className="cmp-empty">
              <div className="cmp-empty-icon">⚖️</div>
              <div className="cmp-empty-title">Select at least 2 policies</div>
              <div className="cmp-empty-sub">Head to the Policies page and pick 2 or more plans to compare side by side.</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const bestIdx = getBestIdx(policies);
  const cols = policies.length + 1; // label col + one per policy

  const tableRows = [
    { label: "Premium", key: (p) => fmt(p.premium) },
    { label: "Term", key: (p) => `${p.term_months} months` },
    { label: "Deductible", key: (p) => p.deductible > 0 ? fmt(p.deductible) : "None" },
    { label: "Type", key: (p) => p.policy_type },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="cmp-root">
        <div className="cmp-bg-grid" />
        <div className="cmp-glow-1" />
        <div className="cmp-glow-2" />

        <div className="cmp-inner">

          {/* Header */}
          <div className="cmp-header">
            <div className="cmp-eyebrow">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Side-by-Side Comparison
            </div>
            <h1 className="cmp-title">Policy Comparison</h1>
            <p className="cmp-subtitle">
              Comparing {policies.length} policies — best value highlighted automatically.
            </p>
          </div>

          {/* Winner banner */}
          <div className="cmp-winner">
            <div className="cmp-winner-icon">🏆</div>
            <div>
              <div className="cmp-winner-text">
                Best value pick:{" "}
                <span className="cmp-winner-name">{policies[bestIdx].title}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "#475569", marginTop: 3 }}>
                Lowest premium at {fmt(policies[bestIdx].premium)}
              </div>
            </div>
          </div>

          {/* Cards */}
          <div
            className="cmp-grid"
            style={{ gridTemplateColumns: `repeat(${policies.length}, 1fr)` }}
          >
            {policies.map((policy, i) => (
              <div key={policy.id} className={`cmp-card ${CARD_CLASSES[i % 3]} ${i === bestIdx ? "best" : ""}`}>
                <div className="cmp-card-bar" />
                <div className="cmp-card-body">

                  {/* Head */}
                  <div className="cmp-card-head">
                    <div>
                      <div className="cmp-card-title">
                        {TYPE_ICONS[policy.policy_type] || "📋"} {policy.title}
                      </div>
                      <div className="cmp-card-type">
                        <div className="cmp-type-dot" />
                        {policy.policy_type}
                      </div>
                    </div>
                    {i === bestIdx && (
                      <div className="cmp-best-badge">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        Best Value
                      </div>
                    )}
                  </div>

                  {/* Metrics */}
                  <div className="cmp-metrics">
                    <div className="cmp-metric">
                      <div className="cmp-metric-label">Premium</div>
                      <div className={`cmp-metric-val ${i === bestIdx ? "highlight" : ""}`}>
                        {fmt(policy.premium)}
                      </div>
                    </div>
                    <div className="cmp-metric">
                      <div className="cmp-metric-label">Term</div>
                      <div className="cmp-metric-val">{policy.term_months}mo</div>
                    </div>
                    <div className="cmp-metric">
                      <div className="cmp-metric-label">Deductible</div>
                      <div className={`cmp-metric-val ${policy.deductible === 0 ? "green" : "amber"}`}>
                        {policy.deductible > 0 ? fmt(policy.deductible) : "None"}
                      </div>
                    </div>
                  </div>

                  {/* Coverage */}
                  {policy.coverage && Object.keys(policy.coverage).length > 0 && (
                    <>
                      <div className="cmp-divider" />
                      <div className="cmp-cov-label">Coverage Details</div>
                      <div className="cmp-cov-grid">
                        {Object.entries(policy.coverage).map(([key, val]) => (
                          <div className="cmp-cov-row" key={key}>
                            <span className="cmp-cov-key">{key.replace(/_/g, " ")}</span>
                            {typeof val === "boolean" ? (
                              <span className={`cmp-cov-val ${val ? "yes" : "no"}`}>
                                {val ? (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                ) : (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                  </svg>
                                )}
                              </span>
                            ) : (
                              <span className="cmp-cov-val neutral">{val}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="cmp-table-section">
            <div className="cmp-table-header">
              <span className="cmp-table-title">At a Glance</span>
              <div className="cmp-table-line" />
            </div>

            <div className="cmp-table">
              {/* Header row */}
              <div
                className="cmp-table-row header-row"
                style={{ gridTemplateColumns: `160px repeat(${policies.length}, 1fr)` }}
              >
                <div className="cmp-table-cell row-label" />
                {policies.map((p, i) => (
                  <div key={p.id} className="cmp-table-cell col-header">
                    {TYPE_ICONS[p.policy_type] || "📋"} {p.title}
                  </div>
                ))}
              </div>

              {/* Data rows */}
              {tableRows.map((row) => (
                <div
                  key={row.label}
                  className="cmp-table-row"
                  style={{ gridTemplateColumns: `160px repeat(${policies.length}, 1fr)` }}
                >
                  <div className="cmp-table-cell row-label">{row.label}</div>
                  {policies.map((p, i) => (
                    <div
                      key={p.id}
                      className={`cmp-table-cell ${i === bestIdx && row.label === "Premium" ? "winner-cell" : "normal-cell"}`}
                    >
                      {row.key(p)}
                      {i === bestIdx && row.label === "Premium" && (
                        <span style={{
                          marginLeft: 8, fontSize: 10, fontWeight: 700,
                          background: "rgba(99,102,241,0.15)", color: "#818cf8",
                          padding: "2px 6px", borderRadius: 100,
                        }}>
                          BEST
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}