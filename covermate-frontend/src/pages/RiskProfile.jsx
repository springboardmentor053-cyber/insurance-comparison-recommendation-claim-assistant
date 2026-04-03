import { useState, useEffect } from 'react';
import { getRiskProfile, updateRiskProfile } from '../services/profileService';
import { useAuth } from '../context/AuthContext';

const AGE_GROUPS = ['18-25', '25-35', '35-45', '45-55', '55+'];
const INCOME_BRACKETS = ['Below 3L', '₹3-5L', '₹5-10L', '₹10-20L', '₹20L+'];
const RISK_APPETITES = [
    { key: 'low', label: 'Low', desc: 'Minimize risk, prefer guaranteed returns', icon: '🛡️' },
    { key: 'medium', label: 'Medium', desc: 'Balanced risk and coverage', icon: '⚖️' },
    { key: 'high', label: 'High', desc: 'Comfortable with higher deductibles for lower premiums', icon: '🎯' },
];
const COVERAGE_PRIORITIES = [
    { key: 'low', label: 'Basic', desc: 'Essential coverage only', icon: '📦' },
    { key: 'medium', label: 'Standard', desc: 'Good coverage at fair price', icon: '📋' },
    { key: 'high', label: 'Premium', desc: 'Maximum coverage, best protection', icon: '👑' },
];
const POLICY_TYPES = [
    { key: 'health', label: 'Health', icon: '🏥' },
    { key: 'life', label: 'Life', icon: '❤️' },
    { key: 'auto', label: 'Auto', icon: '🚗' },
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'travel', label: 'Travel', icon: '✈️' },
];

export default function RiskProfile() {
    const { refreshUser } = useAuth();

    const [ageGroup, setAgeGroup] = useState('');
    const [smoker, setSmoker] = useState(false);
    const [income, setIncome] = useState('');
    const [dependents, setDependents] = useState(false);
    const [preferred, setPreferred] = useState([]);
    const [riskAppetite, setRiskAppetite] = useState('medium');
    const [coveragePriority, setCoveragePriority] = useState('medium');
    const [msg, setMsg] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        getRiskProfile()
            .then((data) => {
                const rp = data.risk_profile;
                if (rp) {
                    setAgeGroup(rp.age_group || '');
                    setSmoker(rp.smoker || false);
                    setIncome(rp.income_bracket || '');
                    setDependents(rp.has_dependents || false);
                    setPreferred(rp.preferred_types || []);
                    setRiskAppetite(rp.risk_appetite || 'medium');
                    setCoveragePriority(rp.coverage_priority || 'medium');
                }
            })
            .catch(() => { })
            .finally(() => setFetching(false));
    }, []);

    const togglePreferred = (type) => {
        setPreferred((prev) =>
            prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg('');
        setError('');
        setLoading(true);

        try {
            await updateRiskProfile({
                age_group: ageGroup,
                smoker,
                income_bracket: income,
                has_dependents: dependents,
                preferred_types: preferred,
                risk_appetite: riskAppetite,
                coverage_priority: coveragePriority,
            });
            await refreshUser();
            setMsg('Preferences saved successfully!');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to save preferences.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="page-wrapper" style={{ justifyContent: 'center', alignItems: 'center' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="page-wrapper">
            <div className="page-content-narrow">
                {/* ────── Header ────── */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.375rem' }}>
                        Insurance Preferences
                    </h1>
                    <p style={{ color: 'var(--clr-text-muted)' }}>
                        Help us recommend the best policies by telling us about yourself.
                    </p>
                </div>

                <div className="glass-card animate-fade-in-up" style={{ padding: '2rem' }}>
                    {msg && <div className="alert-success" style={{ marginBottom: '1.5rem' }}>{msg}</div>}
                    {error && <div className="alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit}>
                        {/* ── Age Group ── */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label className="label">Age Group</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {AGE_GROUPS.map((ag) => (
                                    <button
                                        key={ag}
                                        type="button"
                                        onClick={() => setAgeGroup(ag)}
                                        className={`chip ${ageGroup === ag ? 'chip-active' : ''}`}
                                    >
                                        {ag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Income Bracket ── */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label className="label">Annual Income</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {INCOME_BRACKETS.map((ib) => (
                                    <button
                                        key={ib}
                                        type="button"
                                        onClick={() => setIncome(ib)}
                                        className={`chip ${income === ib ? 'chip-active' : ''}`}
                                    >
                                        {ib}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Toggles ── */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            {/* Smoker */}
                            <div
                                className="toggle-card"
                                onClick={() => setSmoker(!smoker)}
                                style={{
                                    borderColor: smoker ? 'rgba(239,68,68,0.25)' : undefined,
                                    background: smoker ? 'rgba(239,68,68,0.06)' : undefined,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>🚬 Smoker</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)' }}>Do you smoke or use tobacco?</p>
                                    </div>
                                    <div
                                        className="toggle-track"
                                        style={{ background: smoker ? '#ef4444' : 'rgba(100,116,139,0.3)' }}
                                    >
                                        <div
                                            className="toggle-thumb"
                                            style={{ left: smoker ? '1.375rem' : '0.1875rem' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Dependents */}
                            <div
                                className="toggle-card"
                                onClick={() => setDependents(!dependents)}
                                style={{
                                    borderColor: dependents ? 'rgba(6,182,212,0.25)' : undefined,
                                    background: dependents ? 'rgba(6,182,212,0.06)' : undefined,
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '0.25rem' }}>👨‍👩‍👧 Dependents</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--clr-text-dim)' }}>Do you have family dependents?</p>
                                    </div>
                                    <div
                                        className="toggle-track"
                                        style={{ background: dependents ? '#06b6d4' : 'rgba(100,116,139,0.3)' }}
                                    >
                                        <div
                                            className="toggle-thumb"
                                            style={{ left: dependents ? '1.375rem' : '0.1875rem' }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Risk Appetite ── */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label className="label">Risk Appetite</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                {RISK_APPETITES.map((ra) => (
                                    <div
                                        key={ra.key}
                                        onClick={() => setRiskAppetite(ra.key)}
                                        className="toggle-card"
                                        style={{
                                            borderColor: riskAppetite === ra.key ? 'rgba(99,102,241,0.35)' : undefined,
                                            background: riskAppetite === ra.key ? 'rgba(99,102,241,0.08)' : undefined,
                                            textAlign: 'center', padding: '1.25rem 0.75rem',
                                        }}
                                    >
                                        <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.375rem' }}>{ra.icon}</span>
                                        <p style={{
                                            fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem',
                                            color: riskAppetite === ra.key ? 'var(--clr-primary-light)' : 'var(--clr-text)',
                                        }}>{ra.label}</p>
                                        <p style={{ fontSize: '0.6875rem', color: 'var(--clr-text-dim)', lineHeight: 1.4 }}>{ra.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Coverage Priority ── */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label className="label">Coverage Priority</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                {COVERAGE_PRIORITIES.map((cp) => (
                                    <div
                                        key={cp.key}
                                        onClick={() => setCoveragePriority(cp.key)}
                                        className="toggle-card"
                                        style={{
                                            borderColor: coveragePriority === cp.key ? 'rgba(245,158,11,0.35)' : undefined,
                                            background: coveragePriority === cp.key ? 'rgba(245,158,11,0.08)' : undefined,
                                            textAlign: 'center', padding: '1.25rem 0.75rem',
                                        }}
                                    >
                                        <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.375rem' }}>{cp.icon}</span>
                                        <p style={{
                                            fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem',
                                            color: coveragePriority === cp.key ? '#fbbf24' : 'var(--clr-text)',
                                        }}>{cp.label}</p>
                                        <p style={{ fontSize: '0.6875rem', color: 'var(--clr-text-dim)', lineHeight: 1.4 }}>{cp.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── Policy Preferences ── */}
                        <div style={{ marginBottom: '2.25rem' }}>
                            <label className="label">Interested In (select all that apply)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {POLICY_TYPES.map((pt) => (
                                    <button
                                        key={pt.key}
                                        type="button"
                                        onClick={() => togglePreferred(pt.key)}
                                        className={`chip ${preferred.includes(pt.key) ? 'chip-active' : ''}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                                    >
                                        <span>{pt.icon}</span>
                                        <span>{pt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Preferences'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
