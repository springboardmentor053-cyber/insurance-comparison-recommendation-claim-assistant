import { useEffect, useState } from "react";
import {
  getTopRecommendations,
  generateRecommendations,
} from "../services/profileService";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const styles = `
  ${FONTS}

  .rc-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .rc-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #080c14;
    color: #e2e8f0;
    padding: 48px 24px 80px;
    position: relative;
    overflow-x: hidden;
  }

  .rc-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }

  .rc-glow-1 {
    position: fixed; top: -180px; right: -180px;
    width: 560px; height: 560px;
    background: radial-gradient(circle, rgba(99,102,241,0.11) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .rc-glow-2 {
    position: fixed; bottom: -200px; left: -150px;
    width: 480px; height: 480px;
    background: radial-gradient(circle, rgba(168,85,247,0.07) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .rc-inner {
    position: relative; z-index: 1;
    max-width: 860px;
    margin: 0 auto;
  }

  /* ── HEADER ── */
  .rc-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 40px;
    gap: 20px;
    flex-wrap: wrap;
  }

  .rc-header-left {}

  .rc-eyebrow {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.25);
    border-radius: 100px;
    font-size: 10.5px; font-weight: 700; letter-spacing: 0.09em;
    text-transform: uppercase; color: #818cf8;
    margin-bottom: 14px;
  }

  .rc-title {
    font-size: 30px; font-weight: 700;
    letter-spacing: -0.025em;
    color: #f1f5f9;
    line-height: 1.15;
    margin-bottom: 8px;
  }

  .rc-subtitle {
    font-size: 13.5px; color: #64748b; line-height: 1.6;
  }

  .rc-gen-btn {
    flex-shrink: 0;
    display: flex; align-items: center; gap: 9px;
    padding: 13px 22px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border: none; border-radius: 14px;
    color: #fff; font-family: 'Sora', sans-serif;
    font-size: 13.5px; font-weight: 700;
    cursor: pointer;
    box-shadow: 0 8px 28px rgba(99,102,241,0.32), 0 0 0 1px rgba(255,255,255,0.06) inset;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    white-space: nowrap;
    position: relative; overflow: hidden;
  }

  .rc-gen-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 60%);
    pointer-events: none;
  }

  .rc-gen-btn:hover:not(:disabled) {
    opacity: 0.92; transform: translateY(-1px);
    box-shadow: 0 12px 36px rgba(99,102,241,0.42), 0 0 0 1px rgba(255,255,255,0.08) inset;
  }

  .rc-gen-btn:active:not(:disabled) { transform: translateY(0); }
  .rc-gen-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .spin { animation: spin 0.9s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── STATS BAR ── */
  .rc-stats {
    display: flex; gap: 1px;
    background: rgba(99,102,241,0.12);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 16px; overflow: hidden;
    margin-bottom: 36px;
  }

  .rc-stat {
    flex: 1;
    background: rgba(10,14,24,0.95);
    padding: 16px 20px;
    text-align: center;
  }

  .rc-stat-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 22px; font-weight: 600;
    color: #f1f5f9; margin-bottom: 4px;
  }

  .rc-stat-key {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.08em;
    color: #475569;
  }

  /* ── EMPTY ── */
  .rc-empty {
    text-align: center; padding: 80px 20px;
    border: 1px dashed rgba(99,102,241,0.2);
    border-radius: 20px;
    background: rgba(10,14,24,0.5);
  }

  .rc-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .rc-empty-title { font-size: 18px; font-weight: 700; color: #94a3b8; margin-bottom: 8px; }
  .rc-empty-sub { font-size: 13px; color: #475569; }

  /* ── LOADING ── */
  .rc-loading {
    display: flex; align-items: center; justify-content: center; gap: 12px;
    padding: 80px 20px;
    color: #64748b; font-size: 14px;
  }

  .rc-skeleton {
    background: linear-gradient(90deg, rgba(30,41,59,0.8) 25%, rgba(51,65,85,0.5) 50%, rgba(30,41,59,0.8) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 10px;
    height: 14px; margin-bottom: 10px;
  }

  @keyframes shimmer { to { background-position: -200% 0; } }

  /* ── CARDS ── */
  .rc-grid { display: flex; flex-direction: column; gap: 16px; }

  .rc-card {
    background: rgba(13,18,30,0.9);
    border: 1px solid rgba(51,65,85,0.7);
    border-radius: 20px;
    padding: 28px;
    backdrop-filter: blur(12px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    position: relative; overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.2s;
    animation: fadeUp 0.4s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .rc-card:hover {
    border-color: rgba(99,102,241,0.35);
    box-shadow: 0 8px 40px rgba(0,0,0,0.4), 0 0 30px rgba(99,102,241,0.06);
    transform: translateY(-1px);
  }

  .rc-card.best {
    border-color: rgba(99,102,241,0.45);
    box-shadow: 0 0 0 1px rgba(99,102,241,0.15), 0 12px 48px rgba(99,102,241,0.12);
  }

  .rc-card-shine {
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, transparent 50%);
    pointer-events: none;
  }

  .rc-card.best .rc-card-shine {
    background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 50%);
  }

  /* card top row */
  .rc-card-top {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px;
    margin-bottom: 20px;
  }

  .rc-card-left { flex: 1; }

  .rc-best-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px;
    background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.35);
    border-radius: 100px;
    font-size: 10px; font-weight: 800;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: #a5b4fc; margin-bottom: 10px;
  }

  .rc-card-title {
    font-size: 19px; font-weight: 700;
    letter-spacing: -0.02em; color: #f1f5f9;
    margin-bottom: 4px;
  }

  .rc-card-type {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11.5px; font-weight: 600;
    color: #64748b; text-transform: capitalize;
    letter-spacing: 0.03em;
  }

  .rc-type-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #6366f1;
  }

  /* score ring */
  .rc-score-wrap { flex-shrink: 0; text-align: center; }

  .rc-score-ring {
    width: 64px; height: 64px;
    border-radius: 50%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    position: relative;
  }

  .rc-score-ring svg {
    position: absolute; inset: 0;
    transform: rotate(-90deg);
  }

  .rc-score-num {
    font-family: 'JetBrains Mono', monospace;
    font-size: 17px; font-weight: 700;
    color: #f1f5f9; position: relative; z-index: 1;
    line-height: 1;
  }

  .rc-score-lbl {
    font-size: 9px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.07em;
    color: #64748b; position: relative; z-index: 1;
    margin-top: 1px;
  }

  /* divider */
  .rc-card-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent);
    margin-bottom: 20px;
  }

  /* meta row */
  .rc-meta {
    display: flex; gap: 10px; flex-wrap: wrap;
    margin-bottom: 20px;
  }

  .rc-meta-chip {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px;
    background: rgba(15,23,42,0.9);
    border: 1px solid rgba(51,65,85,0.7);
    border-radius: 10px;
    font-size: 12.5px;
  }

  .rc-meta-chip-label {
    color: #64748b; font-weight: 500; font-size: 11px;
  }

  .rc-meta-chip-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px; font-weight: 600; color: #e2e8f0;
  }

  /* reasons */
  .rc-reasons-label {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569; margin-bottom: 10px;
  }

  .rc-reasons { display: flex; flex-direction: column; gap: 7px; }

  .rc-reason {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: #94a3b8;
  }

  .rc-reason-icon {
    width: 20px; height: 20px; border-radius: 6px;
    background: rgba(52,211,153,0.1);
    border: 1px solid rgba(52,211,153,0.2);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* footer */
  .rc-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 20px; padding-top: 16px;
    border-top: 1px solid rgba(51,65,85,0.5);
    flex-wrap: wrap; gap: 8px;
  }

  .rc-timestamp {
    font-size: 11px; color: #334155;
    font-family: 'JetBrains Mono', monospace;
  }

  .rc-rank-badge {
    display: flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600;
    color: #475569;
  }

  /* responsive */
  @media (max-width: 600px) {
    .rc-header { flex-direction: column; }
    .rc-stats { flex-direction: column; gap: 1px; }
    .rc-card-top { flex-direction: column; }
    .rc-score-wrap { align-self: flex-start; }
  }
`;

const TYPE_ICONS = {
  life: "💚", health: "🏥", auto: "🚗", travel: "✈️", home: "🏠",
};

const ScoreRing = ({ score }) => {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const color = score >= 70 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";

  return (
    <div className="rc-score-ring" style={{ width: 64, height: 64 }}>
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(51,65,85,0.6)" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 5px ${color}88)` }}
        />
      </svg>
      <span className="rc-score-num">{score}</span>
      <span className="rc-score-lbl">Score</span>
    </div>
  );
};

const SkeletonCard = () => (
  <div style={{
    background: "rgba(13,18,30,0.9)", border: "1px solid rgba(51,65,85,0.5)",
    borderRadius: 20, padding: 28,
  }}>
    {[80, 50, 65, 40].map((w, i) => (
      <div key={i} className="rc-skeleton" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
    ))}
  </div>
);

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchRecommendations(); }, []);

  const fetchRecommendations = async () => {
    try {
      const data = await getTopRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateRecommendations();
      await fetchRecommendations();
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setGenerating(false);
    }
  };

  const totalPremium = recommendations.reduce((s, r) => s + (r.policy?.premium || 0), 0);
  const avgScore = recommendations.length
    ? Math.round(recommendations.reduce((s, r) => s + r.score, 0) / recommendations.length)
    : 0;

  return (
    <>
      <style>{styles}</style>
      <div className="rc-root">
        <div className="rc-bg-grid" />
        <div className="rc-glow-1" />
        <div className="rc-glow-2" />

        <div className="rc-inner">

          {/* Header */}
          <div className="rc-header">
            <div className="rc-header-left">
              <h1 className="rc-title">Your Recommended Policies</h1>
              <p className="rc-subtitle">
                Personalized matches based on your risk profile and preferences
              </p>
            </div>

            <button className="rc-gen-btn" onClick={handleGenerate} disabled={generating}>
              {generating ? (
                <>
                  <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                  Refresh Results
                </>
              )}
            </button>
          </div>

          {/* Stats Bar */}
          {!loading && recommendations.length > 0 && (
            <div className="rc-stats">
              <div className="rc-stat">
                <div className="rc-stat-val">{recommendations.length}</div>
                <div className="rc-stat-key">Matches Found</div>
              </div>
              <div className="rc-stat">
                <div className="rc-stat-val">{avgScore}</div>
                <div className="rc-stat-key">Avg Match Score</div>
              </div>
              <div className="rc-stat">
                <div className="rc-stat-val">
                  {totalPremium >= 100000
                    ? `₹${(totalPremium / 100000).toFixed(1)}L`
                    : `₹${(totalPremium / 1000).toFixed(0)}K`}
                </div>
                <div className="rc-stat-key">Combined Premium</div>
              </div>
              <div className="rc-stat">
                <div className="rc-stat-val" style={{ color: "#34d399" }}>
                  {recommendations[0]?.score || 0}
                </div>
                <div className="rc-stat-key">Top Match Score</div>
              </div>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="rc-grid">
              {[1, 2, 3].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rc-empty">
              <div className="rc-empty-icon">🔍</div>
              <div className="rc-empty-title">No recommendations yet</div>
              <div className="rc-empty-sub">
                Click "Refresh Results" to generate personalized policy matches for your profile.
              </div>
            </div>
          ) : (
            <div className="rc-grid">
              {recommendations.map((rec, index) => {
                const reasons = rec.reason?.split(",").map((r) => r.trim()).filter(Boolean) || [];
                const isBest = index === 0;

                return (
                  <div
                    key={rec.id}
                    className={`rc-card ${isBest ? "best" : ""}`}
                    style={{ animationDelay: `${index * 0.07}s` }}
                  >
                    <div className="rc-card-shine" />

                    <div className="rc-card-top">
                      <div className="rc-card-left">
                        {isBest && (
                          <div className="rc-best-badge">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            Best Match
                          </div>
                        )}
                        <div className="rc-card-title">
                          {rec.policy?.title || `Policy #${rec.policy_id}`}
                        </div>
                        <div className="rc-card-type">
                          <div className="rc-type-dot" style={{
                            background: isBest ? "#6366f1" : "#475569"
                          }} />
                          {TYPE_ICONS[rec.policy?.policy_type] || "📋"}{" "}
                          {rec.policy?.policy_type || "Insurance"}
                        </div>
                      </div>

                      <div className="rc-score-wrap">
                        <ScoreRing score={rec.score} />
                      </div>
                    </div>

                    <div className="rc-card-divider" />

                    {/* Meta chips */}
                    <div className="rc-meta">
                      <div className="rc-meta-chip">
                        <span className="rc-meta-chip-label">Premium</span>
                        <span className="rc-meta-chip-val">
                          ₹{rec.policy?.premium?.toLocaleString("en-IN") || "—"}
                        </span>
                      </div>
                      <div className="rc-meta-chip">
                        <span className="rc-meta-chip-label">Rank</span>
                        <span className="rc-meta-chip-val">#{index + 1}</span>
                      </div>
                      {rec.policy?.coverage_amount && (
                        <div className="rc-meta-chip">
                          <span className="rc-meta-chip-label">Coverage</span>
                          <span className="rc-meta-chip-val">
                            ₹{(rec.policy.coverage_amount / 100000).toFixed(0)}L
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Reasons */}
                    {reasons.length > 0 && (
                      <>
                        <div className="rc-reasons-label">Why this matches you</div>
                        <div className="rc-reasons">
                          {reasons.map((r, i) => (
                            <div className="rc-reason" key={i}>
                              <div className="rc-reason-icon">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              </div>
                              {r}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Footer */}
                    <div className="rc-card-footer">
                      <span className="rc-timestamp">
                        Generated {new Date(rec.created_at).toLocaleString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                          hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                      <span className="rc-rank-badge">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
                        </svg>
                        Match #{index + 1} of {recommendations.length}
                      </span>
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
};

export default Recommendations;