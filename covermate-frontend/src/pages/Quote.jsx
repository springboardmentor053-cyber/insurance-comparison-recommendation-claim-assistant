import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getPolicies, getQuote, enrollPolicy } from '../services/policyService';

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(amount);
}

export default function Quote() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [policies, setPolicies] = useState([]);
    const [selectedId, setSelectedId] = useState(Number(searchParams.get('policy_id')) || '');
    const [age, setAge] = useState(30);
    const [termOverride, setTermOverride] = useState('');
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [toast, setToast] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        getPolicies().then(setPolicies).catch(() => { });
    }, []);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
    };

    const handleCalculate = async (e) => {
        e.preventDefault();
        if (!selectedId) { setError('Please select a policy.'); return; }
        setError('');
        setLoading(true);
        try {
            const result = await getQuote({
                policy_id: selectedId,
                age,
                term_months: termOverride ? Number(termOverride) : undefined,
            });
            setQuote(result);
        } catch (err) {
            setError(err?.response?.data?.detail || 'Failed to calculate quote.');
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!quote) return;
        setEnrolling(true);
        try {
            await enrollPolicy(quote.policy_id);
            showToast(`✅ Enrolled in "${quote.policy_title}"! Check My Policies.`);
        } catch (err) {
            showToast(err?.response?.data?.detail || '❌ Enrollment failed.');
        } finally {
            setEnrolling(false);
        }
    };

    const adjPct = quote?.age_adjustment_pct || 0;

    return (
        <div className="page-wrapper">
            <div className="page-content" style={{ maxWidth: '720px', margin: '0 auto' }}>
                {/* Toast */}
                {toast && (
                    <div style={{
                        position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 9999,
                        background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '0.75rem', padding: '1rem 1.5rem', color: 'white',
                        fontSize: '0.875rem', fontWeight: 500, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    }}>
                        {toast}
                    </div>
                )}

                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate('/policies')}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#818cf8', fontSize: '0.875rem', fontWeight: 500,
                            marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.375rem',
                        }}
                    >
                        ← Back to Policies
                    </button>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.375rem' }}>
                        Premium <span className="gradient-text">Calculator</span>
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                        Get an instant quote adjusted for your age and coverage needs.
                    </p>
                </div>

                {/* Calculator Form */}
                <div className="glass-card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                    <form onSubmit={handleCalculate}>
                        {/* Policy Select */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Select Policy
                            </label>
                            <select
                                value={selectedId}
                                onChange={(e) => { setSelectedId(Number(e.target.value)); setQuote(null); }}
                                style={{
                                    width: '100%', padding: '0.875rem 1rem',
                                    background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.12)',
                                    borderRadius: '0.75rem', color: 'white', fontSize: '0.9375rem',
                                    fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                                }}
                            >
                                <option value="">— Choose a policy —</option>
                                {policies.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.title} ({p.policy_type}) — {formatCurrency(p.premium)}/mo
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Age Slider */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                <span>Your Age</span>
                                <span style={{ color: '#a5b4fc', fontSize: '1.125rem' }}>{age} years</span>
                            </label>
                            <input
                                type="range" min={18} max={80} value={age}
                                onChange={(e) => { setAge(Number(e.target.value)); setQuote(null); }}
                                style={{ width: '100%', accentColor: '#818cf8', cursor: 'pointer' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                                <span>18</span>
                                <span style={{ color: '#64748b', fontSize: '0.6875rem' }}>
                                    {age <= 35 ? 'No loading' : age <= 45 ? '+10% loading' : age <= 55 ? '+20% loading' : age <= 65 ? '+35% loading' : '+50% loading'}
                                </span>
                                <span>80</span>
                            </div>
                        </div>

                        {/* Term Override (optional) */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                Custom Term (months) <span style={{ color: '#475569', fontWeight: 400, textTransform: 'none' }}>— optional</span>
                            </label>
                            <input
                                type="number" min={1} max={600}
                                placeholder="Leave blank to use policy default"
                                value={termOverride}
                                onChange={(e) => { setTermOverride(e.target.value); setQuote(null); }}
                                style={{
                                    width: '100%', padding: '0.875rem 1rem',
                                    background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(148,163,184,0.12)',
                                    borderRadius: '0.75rem', color: 'white', fontSize: '0.9375rem',
                                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                                }}
                            />
                        </div>

                        {error && (
                            <p style={{ color: '#f87171', fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</p>
                        )}

                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? 'Calculating…' : '⚡ Calculate Premium'}
                        </button>
                    </form>
                </div>

                {/* Quote Result */}
                {quote && (
                    <div className="glass-card animate-fade-in-up" style={{ padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                            {quote.policy_title}
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Quote for age {age}
                            {adjPct > 0 && <span style={{ color: '#fbbf24' }}> · +{adjPct}% age loading applied</span>}
                        </p>

                        {/* Key Metrics */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                            {[
                                { label: 'Base Premium', value: formatCurrency(quote.base_premium), sub: 'per month', color: '#94a3b8' },
                                { label: 'Your Premium', value: formatCurrency(quote.adjusted_premium), sub: 'per month', color: '#a5b4fc' },
                                { label: 'Total Cost', value: formatCurrency(quote.total_cost), sub: `for ${quote.term_months} months`, color: '#67e8f9' },
                                { label: 'Annual Cost', value: formatCurrency(quote.annual_cost), sub: 'per year', color: '#86efac' },
                            ].map((m) => (
                                <div key={m.label} style={{
                                    background: 'rgba(15,23,42,0.5)', borderRadius: '0.75rem',
                                    padding: '1rem', textAlign: 'center',
                                }}>
                                    <p style={{ fontSize: '0.6875rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: '0.375rem' }}>
                                        {m.label}
                                    </p>
                                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: m.color }}>
                                        {m.value}
                                    </p>
                                    <p style={{ fontSize: '0.6875rem', color: '#475569', marginTop: '0.125rem' }}>
                                        {m.sub}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Breakdown */}
                        <div style={{
                            background: 'rgba(15,23,42,0.4)', borderRadius: '0.75rem',
                            padding: '1rem 1.25rem', marginBottom: '1.5rem',
                        }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>
                                Breakdown
                            </p>
                            {Object.entries(quote.breakdown).map(([k, v]) => (
                                <div key={k} style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    padding: '0.4rem 0', borderBottom: '1px solid rgba(148,163,184,0.06)',
                                }}>
                                    <span style={{ fontSize: '0.8125rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                                        {k.replace(/_/g, ' ')}
                                    </span>
                                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#e2e8f0' }}>
                                        {typeof v === 'number' && k.includes('premium') || k.includes('cost') || k.includes('equivalent')
                                            ? formatCurrency(v)
                                            : String(v)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleEnroll}
                            className="btn-primary"
                            style={{ width: '100%' }}
                            disabled={enrolling}
                        >
                            {enrolling ? 'Enrolling…' : '🛡️ Enroll at This Rate'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
