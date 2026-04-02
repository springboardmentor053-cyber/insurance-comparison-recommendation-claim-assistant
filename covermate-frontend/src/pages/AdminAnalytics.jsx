import { useState, useEffect } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { getAnalyticsFraudBySeverity, getAnalyticsFlagsOverTime, getAnalyticsKPIs } from '../services/adminService';

const SEVERITY_COLORS  = { high: '#ef4444', medium: '#f59e0b', low: '#22c55e' };
const SEVERITY_LABELS  = { high: 'High Risk', medium: 'Medium Risk', low: 'Low Risk' };
const BAR_COLOR        = '#7c3aed';

function KpiCard({ icon, label, value, sub, color = '#7c3aed' }) {
    return (
        <div className="glass-card" style={{ padding: '1.5rem', flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    width: '3rem', height: '3rem', borderRadius: '0.875rem',
                    background: `${color}1a`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0,
                }}>
                    {icon}
                </div>
                <div>
                    <p style={{ fontSize: '0.75rem', color: '#6868a0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                    <p style={{ fontSize: '1.875rem', fontWeight: 800, color: '#fff', lineHeight: 1.1, marginTop: '0.125rem' }}>{value}</p>
                    {sub && <p style={{ fontSize: '0.75rem', color: '#9898cc', marginTop: '0.125rem' }}>{sub}</p>}
                </div>
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background: 'rgba(15,15,40,0.95)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '0.5rem', padding: '0.625rem 1rem', fontSize: '0.875rem' }}>
            <p style={{ color: '#e0e0ff', fontWeight: 600 }}>{payload[0].name}: <span style={{ color: payload[0].fill || '#7c3aed' }}>{payload[0].value}</span></p>
        </div>
    );
};

export default function AdminAnalytics() {
    const [donutData,  setDonutData]  = useState([]);
    const [barData,    setBarData]    = useState([]);
    const [kpis,       setKpis]       = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');

    useEffect(() => {
        Promise.all([
            getAnalyticsFraudBySeverity(),
            getAnalyticsFlagsOverTime(),
            getAnalyticsKPIs(),
        ])
        .then(([severity, timeline, kpiData]) => {
            setDonutData(severity.map(s => ({
                name: SEVERITY_LABELS[s.severity] || s.severity,
                value: s.count,
                color: SEVERITY_COLORS[s.severity] || '#6b7280',
            })));
            setBarData(timeline.map(t => ({
                date: t.date?.slice(5),   // "MM-DD"
                Flags: t.count,
            })));
            setKpis(kpiData);
        })
        .catch(() => setError('Failed to load analytics data.'))
        .finally(() => setLoading(false));
    }, []);

    return (
        <div className="page-wrapper">
            <div className="page-content">
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        ⚡ <span className="gradient-text">Fraud Analytics</span>
                    </h1>
                    <p style={{ color: '#9898cc' }}>Risk intelligence & fraud detection metrics</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.5rem', color: '#f87171' }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', color: '#6868a0', padding: '4rem' }}>Loading analytics…</div>
                ) : (
                    <>
                        {/* ── KPI Row ── */}
                        <div className="animate-fade-in-up" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                            <KpiCard
                                icon="⏳" label="Pending Claims"
                                value={kpis?.pending_claims ?? '—'}
                                sub="Awaiting admin decision"
                                color="#f59e0b"
                            />
                            <KpiCard
                                icon="📊" label="Settlement Ratio"
                                value={kpis ? `${kpis.settlement_ratio}%` : '—'}
                                sub="Approved ÷ (Approved + Rejected)"
                                color="#22c55e"
                            />
                            <KpiCard
                                icon="💰" label="Payouts This Month"
                                value={kpis ? `₹${Number(kpis.total_payouts_this_month).toLocaleString('en-IN')}` : '—'}
                                sub="Paid claims this calendar month"
                                color="#a855f7"
                            />
                        </div>

                        {/* ── Charts Row ── */}
                        <div className="animate-fade-in-up-delay" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

                            {/* Donut Chart */}
                            <div className="glass-card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontWeight: 700, color: '#e0e0ff', marginBottom: '0.25rem' }}>Claims by Risk Level</h3>
                                <p style={{ fontSize: '0.8125rem', color: '#6868a0', marginBottom: '1.25rem' }}>Fraud flags grouped by severity</p>
                                {donutData.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6868a0' }}>
                                        ✅ No fraud flags recorded yet
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie
                                                data={donutData}
                                                cx="50%" cy="50%"
                                                innerRadius={70} outerRadius={110}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {donutData.map((entry, i) => (
                                                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                formatter={(value) => <span style={{ color: '#9898cc', fontSize: '0.8125rem' }}>{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>

                            {/* Bar Chart */}
                            <div className="glass-card" style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontWeight: 700, color: '#e0e0ff', marginBottom: '0.25rem' }}>Fraud Alerts — Last 30 Days</h3>
                                <p style={{ fontSize: '0.8125rem', color: '#6868a0', marginBottom: '1.25rem' }}>Daily fraud rule triggers</p>
                                {barData.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6868a0' }}>
                                        No flags in the last 30 days
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(124,58,237,0.1)" />
                                            <XAxis dataKey="date" tick={{ fill: '#6868a0', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fill: '#6868a0', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,58,237,0.08)' }} />
                                            <Bar dataKey="Flags" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* ── Severity Legend detail ── */}
                        <div className="glass-card animate-fade-in-up-delay-2" style={{ padding: '1.25rem 1.5rem' }}>
                            <h3 style={{ fontWeight: 700, color: '#e0e0ff', marginBottom: '1rem', fontSize: '0.9375rem' }}>Severity Breakdown</h3>
                            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                {donutData.length === 0 ? (
                                    <p style={{ color: '#6868a0' }}>No fraud data available.</p>
                                ) : donutData.map(d => (
                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                        <div style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: d.color }} />
                                        <span style={{ color: '#9898cc', fontSize: '0.875rem' }}>{d.name}</span>
                                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
