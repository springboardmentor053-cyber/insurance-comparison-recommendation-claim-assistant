import { useState } from 'react';
import api from '../services/api';

const RTO_EXAMPLES = ['DL3CAB1234', 'MH12AB1234', 'KA01AA1234', 'TN09BZ1234', 'GJ01AA9999'];

export default function VehicleLookup() {
    const [reg,     setReg]     = useState('');
    const [result,  setResult]  = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState('');

    const handleLookup = async (e) => {
        if (e) e.preventDefault();
        if (!reg.trim()) return;
        setLoading(true); setError(''); setResult(null);
        try {
            const { data } = await api.get(`/vehicle/lookup?reg=${encodeURIComponent(reg.trim())}`);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Lookup failed. Check the registration number.');
        } finally {
            setLoading(false);
        }
    };

    const fuelIcon = { Petrol: '⛽', Diesel: '🛢️', CNG: '🌿', Electric: '⚡', Hybrid: '🔋' };

    return (
        <div className="page-wrapper">
            <div className="page-content" style={{ maxWidth: '48rem', margin: '0 auto' }}>
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        🚗 <span className="gradient-text">Vehicle RTO Lookup</span>
                    </h1>
                    <p style={{ color: '#9898cc' }}>
                        Enter your vehicle registration number to auto-fill car details for an instant quote.
                    </p>
                </div>

                {/* Search card */}
                <div className="glass-card animate-fade-in-up" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
                    <form onSubmit={handleLookup}>
                        <label style={{ display:'block', fontSize:'0.8125rem', fontWeight:600, color:'#9898cc', marginBottom:'0.5rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                            Registration Number
                        </label>
                        <div style={{ display:'flex', gap:'0.75rem' }}>
                            <input
                                type="text"
                                value={reg}
                                onChange={e => setReg(e.target.value.toUpperCase())}
                                placeholder="e.g. DL3CAB1234"
                                className="input-field"
                                style={{ flex:1, fontFamily:'monospace', fontSize:'1rem', letterSpacing:'0.08em', textTransform:'uppercase' }}
                            />
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading || !reg.trim()}
                                style={{ whiteSpace:'nowrap', minWidth:'7rem' }}
                            >
                                {loading ? 'Looking up…' : '🔍 Lookup'}
                            </button>
                        </div>
                    </form>

                    {/* Examples */}
                    <div style={{ marginTop:'1rem' }}>
                        <p style={{ fontSize:'0.75rem', color:'#6868a0', marginBottom:'0.5rem' }}>Try an example:</p>
                        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                            {RTO_EXAMPLES.map(ex => (
                                <button key={ex} onClick={() => { setReg(ex); }}
                                    style={{ padding:'0.25rem 0.625rem', borderRadius:'0.375rem', background:'rgba(124,58,237,0.1)', border:'1px solid rgba(124,58,237,0.2)', color:'#c4b5fd', fontSize:'0.75rem', cursor:'pointer', fontFamily:'monospace' }}>
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1.5rem', color:'#f87171' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Result card */}
                {result && (
                    <div className="glass-card animate-fade-in-up" style={{ padding:'2rem' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
                            <div>
                                <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:'#fff' }}>
                                    {result.make} {result.model}
                                </h2>
                                <p style={{ color:'#9898cc', fontSize:'0.9375rem', marginTop:'0.25rem' }}>
                                    {result.year} · {fuelIcon[result.fuel_type] || '🚗'} {result.fuel_type} · {result.vehicle_class}
                                </p>
                            </div>
                            <div style={{ textAlign:'right' }}>
                                <p style={{ fontSize:'0.75rem', color:'#6868a0' }}>Registration</p>
                                <p style={{ fontFamily:'monospace', fontSize:'1.125rem', fontWeight:700, color:'#c4b5fd', letterSpacing:'0.1em' }}>{result.reg_number}</p>
                            </div>
                        </div>

                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
                            {[
                                { label:'RTO Code', value:result.rto_code, icon:'🏛️' },
                                { label:'RTO City', value:result.rto_city, icon:'📍' },
                                { label:'Fuel Type', value:result.fuel_type, icon: fuelIcon[result.fuel_type] || '⛽' },
                                { label:'Year', value:result.year, icon:'📅' },
                            ].map(item => (
                                <div key={item.label} style={{ background:'rgba(124,58,237,0.07)', borderRadius:'0.75rem', padding:'1rem', border:'1px solid rgba(124,58,237,0.12)' }}>
                                    <p style={{ fontSize:'1rem', marginBottom:'0.25rem' }}>{item.icon}</p>
                                    <p style={{ fontSize:'0.75rem', color:'#6868a0', marginBottom:'0.125rem' }}>{item.label}</p>
                                    <p style={{ fontWeight:700, color:'#e0e0ff' }}>{item.value}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            className="btn-primary"
                            onClick={() => window.location.href = '/policies?cat=auto'}
                            style={{ width:'100%' }}
                        >
                            🚀 Get Insurance Quotes for this Vehicle
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
