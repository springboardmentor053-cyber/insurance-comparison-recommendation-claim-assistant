import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import axios from 'axios';

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

const styles = `
  ${FONTS}

  .db-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #080c14;
    color: #e2e8f0;
    padding: 48px 24px 80px;
    position: relative;
    overflow-x: hidden;
  }

  .db-bg-grid {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.032) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.032) 1px, transparent 1px);
    background-size: 44px 44px;
    pointer-events: none; z-index: 0;
  }

  .db-glow-1 {
    position: fixed; top: -200px; right: -200px;
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .db-glow-2 {
    position: fixed; bottom: -200px; left: -150px;
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
  }

  .db-inner {
    position: relative; z-index: 1;
    max-width: 960px; margin: 0 auto;
  }

  /* ── WELCOME ── */
  .db-welcome {
    margin-bottom: 40px;
    animation: fadeUp 0.5s ease both;
  }

  .db-greeting {
    font-size: 28px; font-weight: 700;
    letter-spacing: -0.025em; color: #f1f5f9;
    line-height: 1.2; margin-bottom: 8px;
  }

  .db-greeting-name {
    background: linear-gradient(135deg, #818cf8, #a78bfa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .db-greeting-sub { font-size: 14px; color: #64748b; }

  /* time chip */
  .db-time-chip {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 4px 12px;
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 100px;
    font-size: 11px; font-weight: 600;
    color: #6366f1; letter-spacing: 0.06em;
    margin-bottom: 14px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── STATS ── */
  .db-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
    margin-bottom: 40px;
    animation: fadeUp 0.5s ease 0.08s both;
  }

  .db-stat-card {
    background: rgba(13,18,30,0.9);
    border: 1px solid rgba(51,65,85,0.7);
    border-radius: 18px;
    padding: 22px 24px;
    position: relative; overflow: hidden;
    backdrop-filter: blur(12px);
    transition: border-color 0.25s, transform 0.2s, box-shadow 0.2s;
  }

  .db-stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }

  .db-stat-card-shine {
    position: absolute; inset: 0;
    pointer-events: none;
    border-radius: 18px;
  }

  .db-stat-top {
    display: flex; align-items: flex-start;
    justify-content: space-between; margin-bottom: 16px;
  }

  .db-stat-icon {
    width: 42px; height: 42px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }

  .db-stat-trend {
    font-size: 10.5px; font-weight: 700;
    padding: 3px 8px; border-radius: 100px;
    font-family: 'JetBrains Mono', monospace;
  }

  .db-stat-val {
    font-family: 'JetBrains Mono', monospace;
    font-size: 30px; font-weight: 700;
    color: #f1f5f9; line-height: 1; margin-bottom: 6px;
  }

  .db-stat-label {
    font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.09em;
    color: #475569;
  }

  .db-stat-bar {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 2px; border-radius: 0 0 18px 18px;
  }

  /* skeleton pulse */
  .db-pulse { animation: pulse 1.5s ease infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

  /* ── SECTION HEADER ── */
  .db-section-header {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 16px;
  }

  .db-section-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, rgba(99,102,241,0.2), transparent);
  }

  .db-section-title {
    font-size: 11.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    color: #475569;
  }

  /* ── QUICK ACTIONS ── */
  .db-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-bottom: 32px;
    animation: fadeUp 0.5s ease 0.16s both;
  }

  .db-action-card {
    background: rgba(13,18,30,0.9);
    border: 1px solid rgba(51,65,85,0.6);
    border-radius: 18px;
    padding: 22px 24px;
    text-decoration: none;
    display: block;
    position: relative; overflow: hidden;
    backdrop-filter: blur(12px);
    transition: all 0.25s ease;
  }

  .db-action-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.35);
  }

  .db-action-card-top {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 10px;
  }

  .db-action-icon {
    width: 40px; height: 40px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }

  .db-action-title {
    font-size: 15px; font-weight: 700;
    color: #f1f5f9; flex: 1;
  }

  .db-action-arrow {
    width: 28px; height: 28px; border-radius: 8px;
    background: rgba(99,102,241,0.1);
    border: 1px solid rgba(99,102,241,0.2);
    display: flex; align-items: center; justify-content: center;
    color: #6366f1; flex-shrink: 0;
    transition: background 0.2s, transform 0.2s;
  }

  .db-action-card:hover .db-action-arrow {
    background: rgba(99,102,241,0.2);
    transform: translateX(2px);
  }

  .db-action-desc {
    font-size: 12.5px; color: #64748b;
    line-height: 1.55; padding-left: 52px;
  }

  /* ── CTA BANNER ── */
  .db-cta {
    background: rgba(13,18,30,0.9);
    border: 1px solid rgba(245,158,11,0.25);
    border-left: 3px solid #f59e0b;
    border-radius: 18px;
    padding: 24px 28px;
    display: flex; gap: 18px; align-items: flex-start;
    backdrop-filter: blur(12px);
    animation: fadeUp 0.5s ease 0.24s both;
    position: relative; overflow: hidden;
  }

  .db-cta::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(245,158,11,0.04) 0%, transparent 60%);
    pointer-events: none;
  }

  .db-cta-icon {
    width: 46px; height: 46px; border-radius: 14px;
    background: rgba(245,158,11,0.1);
    border: 1px solid rgba(245,158,11,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }

  .db-cta-title {
    font-size: 15px; font-weight: 700; color: #fde68a;
    margin-bottom: 6px;
  }

  .db-cta-sub {
    font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 16px;
  }

  .db-cta-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px;
    background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.3);
    border-radius: 11px;
    color: #fbbf24; font-family: 'Sora', sans-serif;
    font-size: 13px; font-weight: 700;
    text-decoration: none;
    transition: all 0.2s;
  }

  .db-cta-btn:hover {
    background: rgba(245,158,11,0.2);
    border-color: rgba(245,158,11,0.5);
    transform: translateY(-1px);
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    .db-stats { grid-template-columns: 1fr; }
    .db-actions { grid-template-columns: 1fr; }
  }
`;

// ── Only change: My Claims path updated + comingSoon removed ──
const quickLinks = [
  {
    title: 'My Profile',
    desc: 'View and edit your personal information',
    icon: '👤',
    path: '/profile',
    accent: '#6366f1',
    iconBg: 'rgba(99,102,241,0.12)',
    borderHover: 'rgba(99,102,241,0.35)',
  },
  {
    title: 'Risk Profile',
    desc: 'Set your insurance preferences & risk appetite',
    icon: '⚙️',
    path: '/preferences',
    accent: '#06b6d4',
    iconBg: 'rgba(6,182,212,0.12)',
    borderHover: 'rgba(6,182,212,0.35)',
  },
  {
    title: 'Browse Policies',
    desc: 'Compare insurance plans from top insurers',
    icon: '📋',
    path: '/policies',
    accent: '#22c55e',
    iconBg: 'rgba(34,197,94,0.12)',
    borderHover: 'rgba(34,197,94,0.35)',
  },
  {
    title: 'My Claims',
    desc: 'File and track your insurance claims',
    icon: '📁',
    path: '/claims',              // ✅ was '#'
    accent: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.12)',
    borderHover: 'rgba(245,158,11,0.35)',
                                  // ✅ comingSoon removed
  },
];

const getTimeGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const fmtTime = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ activePolicies: null, openClaims: null, recommendations: null });
  const [time, setTime] = useState(fmtTime());

  useEffect(() => {
    const interval = setInterval(() => setTime(fmtTime()), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    // fetch active policies count
    axios.get('http://127.0.0.1:8000/policies/my', { headers })
      .then((res) => {
        const active = res.data.filter((p) => p.status === 'active').length;
        setStats((s) => ({ ...s, activePolicies: active }));
      })
      .catch(() => setStats((s) => ({ ...s, activePolicies: 0 })));

    // fetch open claims count ✅ now live
    axios.get('http://127.0.0.1:8000/claims', { headers })
      .then((res) => {
        const open = res.data.filter((c) =>
          ['submitted', 'under_review'].includes(c.status)
        ).length;
        setStats((s) => ({ ...s, openClaims: open }));
      })
      .catch(() => setStats((s) => ({ ...s, openClaims: 0 })));

    // fetch recommendations count
    axios.get('http://127.0.0.1:8000/recommendations/top', { headers })
      .then((res) => setStats((s) => ({ ...s, recommendations: res.data?.length ?? 0 })))
      .catch(() => setStats((s) => ({ ...s, recommendations: 0 })));
  }, []);

  const statCards = [
    {
      label: 'Active Policies',
      value: stats.activePolicies,
      icon: '🛡️',
      accent: '#6366f1',
      iconBg: 'rgba(99,102,241,0.12)',
      barColor: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
      trendColor: 'rgba(99,102,241,0.15)',
      trendText: '#818cf8',
    },
    {
      label: 'Open Claims',
      value: stats.openClaims,
      icon: '📝',
      accent: '#06b6d4',
      iconBg: 'rgba(6,182,212,0.12)',
      barColor: 'linear-gradient(90deg, #06b6d4, #0ea5e9)',
      trendColor: 'rgba(6,182,212,0.12)',
      trendText: '#22d3ee',
    },
    {
      label: 'Recommendations',
      value: stats.recommendations,
      icon: '⭐',
      accent: '#f59e0b',
      iconBg: 'rgba(245,158,11,0.12)',
      barColor: 'linear-gradient(90deg, #f59e0b, #f97316)',
      trendColor: 'rgba(245,158,11,0.12)',
      trendText: '#fbbf24',
    },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="db-root">
        <div className="db-bg-grid" />
        <div className="db-glow-1" />
        <div className="db-glow-2" />

        <div className="db-inner">

          {/* Welcome */}
          <div className="db-welcome">
            <div className="db-time-chip">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {time}
            </div>
            <h1 className="db-greeting">
              {getTimeGreeting()},{' '}
              <span className="db-greeting-name">{user?.name?.split(' ')[0] || 'there'}</span>! 👋
            </h1>
            <p className="db-greeting-sub">Here's your insurance dashboard overview.</p>
          </div>

          {/* Stats */}
          <div className="db-stats">
            {statCards.map((s, i) => (
              <div
                key={s.label}
                className="db-stat-card"
                style={{
                  borderColor: stats[['activePolicies','openClaims','recommendations'][i]] > 0
                    ? `${s.accent}30` : 'rgba(51,65,85,0.7)',
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <div
                  className="db-stat-card-shine"
                  style={{ background: `linear-gradient(135deg, ${s.accent}06 0%, transparent 60%)` }}
                />

                <div className="db-stat-top">
                  <div className="db-stat-icon" style={{ background: s.iconBg }}>
                    {s.icon}
                  </div>
                  <div
                    className="db-stat-trend"
                    style={{ background: s.trendColor, color: s.trendText }}
                  >
                    LIVE
                  </div>
                </div>

                <div className="db-stat-val">
                  {s.value === null ? (
                    <span className="db-pulse" style={{ color: '#334155' }}>—</span>
                  ) : s.value}
                </div>
                <div className="db-stat-label">{s.label}</div>

                <div className="db-stat-bar" style={{ background: s.barColor }} />
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="db-section-header" style={{ animation: 'fadeUp 0.5s ease 0.12s both' }}>
            <span className="db-section-title">Quick Actions</span>
            <div className="db-section-line" />
          </div>

          <div className="db-actions">
            {quickLinks.map((link, i) => (
              <Link
                key={link.title}
                to={link.path}
                className="db-action-card"
                style={{ animationDelay: `${0.16 + i * 0.06}s`, animation: 'fadeUp 0.5s ease both' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = link.borderHover;
                  e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.3), 0 0 24px ${link.accent}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 18,
                    background: `linear-gradient(135deg, ${link.accent}06 0%, transparent 55%)`,
                    pointerEvents: 'none',
                  }}
                />
                <div className="db-action-card-top">
                  <div className="db-action-icon" style={{ background: link.iconBg }}>
                    {link.icon}
                  </div>
                  <span className="db-action-title">{link.title}</span>
                  <div className="db-action-arrow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </div>
                <p className="db-action-desc">{link.desc}</p>
              </Link>
            ))}
          </div>

          {/* Risk Profile CTA */}
          {!user?.risk_profile && (
            <div className="db-cta">
              <div className="db-cta-icon">💡</div>
              <div>
                <div className="db-cta-title">Complete your risk profile</div>
                <p className="db-cta-sub">
                  Tell us about your income, family size, and coverage needs so we can surface the best-matched policies for you.
                </p>
                <Link to="/preferences" className="db-cta-btn">
                  Set Preferences
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}