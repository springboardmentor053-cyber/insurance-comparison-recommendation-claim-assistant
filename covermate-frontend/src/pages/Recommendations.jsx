import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { generateRecommendations, getRecommendations } from '../services/recommendationService';

const TYPE_META = {
    health: { icon: '🏥', color: '#22c55e', label: 'Health' },
    life:   { icon: '❤️', color: '#ef4444', label: 'Life' },
    auto:   { icon: '🚗', color: '#3b82f6', label: 'Auto' },
    home:   { icon: '🏠', color: '#f59e0b', label: 'Home' },
    travel: { icon: '✈️', color: '#8b5cf6', label: 'Travel' },
};

function ScoreBar({ score }) {
    const pct = Math.min(score, 100);
    const color =
        pct >= 75 ? '#22c55e' :
        pct >= 50 ? '#f59e0b' :
        '#ef4444';

    return (
        <div style={{
            width: '100%', height: '0.5rem', borderRadius: '0.25rem',
            background: 'rgba(124,58,237,0.1)', overflow: 'hidden',
        }}>
            <div style={{
                width: `${pct}%`, height: '100%', borderRadius: '0.25rem',
                background: `linear-gradient(90deg, ${color}cc, ${color})`,
                transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }} />
        </div>
    );
}

export default function Recommendations() {
    const { user } = useAuth();
    const [recs, setRecs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    // Load existing recommendations on mount
    useEffect(() => {
        getRecommendations()
            .then(setRecs)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleGenerate = async () => {
        setGenerating(true);
        setError('');
        try {
            const data = await generateRecommendations();
            setRecs(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to generate recommendations.');
        } finally {
            setGenerating(false);
        }
    };

    // ── No risk profile CTA ──
    if (!loading && !user?.risk_profile) {
        return (
            <div className="page-wrapper">
                <div className="page-content" style={{ maxWidth: '42rem' }}>
                    <div className="animate-fade-in-up" style={{ textAlign: 'center', padding: '3rem 0' }}>
                        <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem' }}>🔍</span>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                            Set Up Your Preferences First
                        </h1>
                        <p style={{ color: '#9898cc', fontSize: '1.0625rem', marginBottom: '2rem', lineHeight: 1.7 }}>
                            We need to know about your age, income, and insurance preferences to
                            generate personalized recommendations.
                        </p>
                        <Link to="/preferences" className="btn-primary" style={{ width: 'auto', display: 'inline-flex', padding: '0.875rem 2rem' }}>
                            ⚙️ Set Preferences
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    const topScore = recs.length ? Math.max(...recs.map(r => r.score)) : 0;
    const avgScore = recs.length ? Math.round(recs.reduce((s, r) => s + r.score, 0) / recs.length) : 0;

    return (
        <div className="page-wrapper">
            <div className="page-content">
                {/* ── Header ── */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.375rem' }}>
                        <span className="gradient-text">Recommended</span> for You ⭐
                    </h1>
                    <p style={{ color: '#9898cc', fontSize: '1.0625rem' }}>
                        Policies scored and ranked based on your risk profile, age, and preferences.
                    </p>
                </div>

                {/* ── Stats + Generate ── */}
                <div
                    className="animate-fade-in-up-delay"
                    style={{
                        display: 'flex', flexWrap: 'wrap', gap: '1rem',
                        alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '2rem',
                    }}
                >
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        {recs.length > 0 && (
                            <>
                                <div className="glass-card" style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>📊</span>
                                    <div>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white' }}>{recs.length}</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6868a0' }}>Policies Scored</p>
                                    </div>
                                </div>
                                <div className="glass-card" style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>🏆</span>
                                    <div>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#22c55e' }}>{topScore}%</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6868a0' }}>Top Match</p>
                                    </div>
                                </div>
                                <div className="glass-card" style={{ padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontSize: '1.25rem' }}>📈</span>
                                    <div>
                                        <p style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{avgScore}%</p>
                                        <p style={{ fontSize: '0.75rem', color: '#6868a0' }}>Avg Score</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        className="btn-primary"
                        onClick={handleGenerate}
                        disabled={generating}
                        style={{ width: 'auto', padding: '0.75rem 1.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                        {generating ? (
                            <>
                                <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px' }}></div>
                                Scoring Policies...
                            </>
                        ) : (
                            <>🔄 {recs.length > 0 ? 'Refresh Recommendations' : 'Generate Recommendations'}</>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="alert-error animate-fade-in" style={{ marginBottom: '1.5rem' }}>{error}</div>
                )}

                {/* ── Empty State ── */}
                {recs.length === 0 && !generating && (
                    <div className="glass-card animate-fade-in-up-delay" style={{ padding: '3rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⭐</span>
                        <h3 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#e0e0ff' }}>
                            No recommendations yet
                        </h3>
                        <p style={{ color: '#6868a0', fontSize: '0.9375rem' }}>
                            Click <strong>"Generate Recommendations"</strong> to score policies against your profile.
                        </p>
                    </div>
                )}

                {/* ── Recommendation Cards ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
                    {recs.map((rec, idx) => {
                        const meta = TYPE_META[rec.policy?.policy_type] || { icon: '📄', color: '#64748b', label: 'Other' };
                        const isTop = idx === 0 && rec.score >= 70;

                        return (
                            <div
                                key={rec.id}
                                className="glass-card animate-fade-in-up"
                                style={{
                                    padding: '1.5rem',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    transition: 'all 0.3s ease',
                                    borderColor: isTop ? 'rgba(249,115,22,0.3)' : undefined,
                                    animationDelay: `${idx * 0.06}s`,
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4), 0 0 30px rgba(124,58,237,0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '';
                                }}
                            >
                                {/* Top match badge */}
                                {isTop && (
                                    <div style={{
                                        position: 'absolute', top: '0.75rem', right: '0.75rem',
                                        background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                        color: 'white', fontSize: '0.625rem', fontWeight: 700,
                                        padding: '0.25rem 0.625rem', borderRadius: '0.5rem',
                                        letterSpacing: '0.06em', textTransform: 'uppercase',
                                    }}>
                                        🏆 Best Match
                                    </div>
                                )}

                                {/* Type Badge + Rank */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div style={{
                                        width: '2.5rem', height: '2.5rem', borderRadius: '0.75rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.25rem', background: `${meta.color}15`, flexShrink: 0,
                                    }}>
                                        {meta.icon}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <span style={{
                                            fontSize: '0.625rem', fontWeight: 600, color: meta.color,
                                            background: `${meta.color}15`, padding: '0.125rem 0.5rem',
                                            borderRadius: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#6868a0', fontWeight: 600 }}>
                                        #{idx + 1}
                                    </span>
                                </div>

                                {/* Title + Provider */}
                                <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem', lineHeight: 1.3 }}>
                                    {rec.policy?.title}
                                </h3>
                                <p style={{ fontSize: '0.75rem', color: '#6868a0', marginBottom: '1rem' }}>
                                    by {rec.policy?.provider?.name || 'Unknown Provider'}
                                </p>

                                {/* Score */}
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: '#9898cc', fontWeight: 500 }}>Match Score</span>
                                        <span style={{
                                            fontSize: '0.875rem', fontWeight: 700,
                                            color: rec.score >= 75 ? '#22c55e' : rec.score >= 50 ? '#f59e0b' : '#ef4444',
                                        }}>
                                            {rec.score}%
                                        </span>
                                    </div>
                                    <ScoreBar score={rec.score} />
                                </div>

                                {/* Premium + Deductible */}
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem',
                                    marginBottom: '1rem', padding: '0.75rem',
                                    background: 'rgba(10,10,40,0.4)', borderRadius: '0.625rem',
                                }}>
                                    <div>
                                        <p style={{ fontSize: '0.6875rem', color: '#6868a0', marginBottom: '0.125rem' }}>Premium</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#e0e0ff' }}>
                                            ₹{rec.policy?.premium?.toLocaleString()}<span style={{ fontSize: '0.6875rem', color: '#6868a0', fontWeight: 400 }}>/mo</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '0.6875rem', color: '#6868a0', marginBottom: '0.125rem' }}>Deductible</p>
                                        <p style={{ fontSize: '1rem', fontWeight: 700, color: '#e0e0ff' }}>
                                            ₹{rec.policy?.deductible?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                </div>

                                {/* Reason */}
                                <div style={{
                                    padding: '0.75rem', borderRadius: '0.625rem',
                                    background: 'rgba(124,58,237,0.06)',
                                    border: '1px solid rgba(124,58,237,0.1)',
                                    marginBottom: '1rem',
                                }}>
                                    <p style={{ fontSize: '0.75rem', color: '#9898cc', fontWeight: 600, marginBottom: '0.25rem' }}>
                                        💡 Why this policy?
                                    </p>
                                    <p style={{ fontSize: '0.8125rem', color: '#d0d0e8', lineHeight: 1.6 }}>
                                        {rec.reason}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Link
                                        to={`/quote?policy_id=${rec.policy_id}`}
                                        className="btn-secondary"
                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
                                    >
                                        💰 Get Quote
                                    </Link>
                                    <Link
                                        to={`/policies`}
                                        className="btn-secondary"
                                        style={{ flex: 1, justifyContent: 'center', fontSize: '0.8125rem' }}
                                    >
                                        📋 View Details
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
