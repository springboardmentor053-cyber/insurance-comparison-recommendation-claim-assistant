import { useState, useEffect } from 'react';
import api from '../services/api';

const TYPE_TABS = [
    { key: 'hospital', label: '🏥 Cashless Hospitals', desc: 'Network hospitals for health insurance' },
    { key: 'garage',   label: '🔧 Network Garages',    desc: 'Authorised garages for auto insurance' },
];

export default function NetworkLocator() {
    const [type,      setType]      = useState('hospital');
    const [pincode,   setPincode]   = useState('');
    const [city,      setCity]      = useState('');
    const [results,   setResults]   = useState([]);
    const [loading,   setLoading]   = useState(false);
    const [searched,  setSearched]  = useState(false);
    const [error,     setError]     = useState('');

    const search = async () => {
        setLoading(true); setError(''); setSearched(true);
        try {
            const params = new URLSearchParams({ provider_type: type });
            if (pincode.trim()) params.append('pincode', pincode.trim());
            if (city.trim())    params.append('city', city.trim());
            const { data } = await api.get(`/network/search?${params}`);
            setResults(data);
        } catch {
            setError('Search failed. Please try again.');
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-search when type changes if we've already searched
    useEffect(() => {
        if (searched) search();
    }, [type]);

    const tabInfo = TYPE_TABS.find(t => t.key === type);

    return (
        <div className="page-wrapper">
            <div className="page-content">
                {/* Header */}
                <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                        📍 <span className="gradient-text">Network Locator</span>
                    </h1>
                    <p style={{ color: '#9898cc' }}>Find cashless hospitals and authorised network garages near you</p>
                </div>

                {/* Search Card */}
                <div className="glass-card animate-fade-in-up" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    {/* Type Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'rgba(124,58,237,0.06)', borderRadius: '0.875rem', padding: '0.25rem' }}>
                        {TYPE_TABS.map(t => (
                            <button
                                key={t.key}
                                onClick={() => setType(t.key)}
                                style={{
                                    flex: 1, padding: '0.625rem 1rem', borderRadius: '0.625rem',
                                    background: type === t.key ? 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(99,46,210,0.3))' : 'transparent',
                                    border: type === t.key ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
                                    color: type === t.key ? '#e0e0ff' : '#9898cc',
                                    fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem',
                                    transition: 'all 0.2s', textAlign: 'center',
                                }}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Filters */}
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1, minWidth: '160px' }}>
                            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'#9898cc', marginBottom:'0.375rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>Pincode</label>
                            <input
                                type="text" maxLength={6}
                                value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/,''))}
                                placeholder="e.g. 110001"
                                className="input-field"
                                onKeyDown={e => e.key === 'Enter' && search()}
                            />
                        </div>
                        <div style={{ flex: 2, minWidth: '220px' }}>
                            <label style={{ display:'block', fontSize:'0.75rem', fontWeight:600, color:'#9898cc', marginBottom:'0.375rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>City</label>
                            <input
                                type="text"
                                value={city} onChange={e => setCity(e.target.value)}
                                placeholder="e.g. Mumbai, Delhi, Bengaluru…"
                                className="input-field"
                                onKeyDown={e => e.key === 'Enter' && search()}
                            />
                        </div>
                        <button onClick={search} className="btn-primary" style={{ whiteSpace:'nowrap', alignSelf:'flex-end', marginBottom:'0.125rem' }}>
                            🔍 Search
                        </button>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1.5rem', color:'#f87171' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Results */}
                {loading ? (
                    <div style={{ textAlign:'center', color:'#6868a0', padding:'4rem' }}>Searching…</div>
                ) : searched && (
                    <div className="animate-fade-in-up-delay">
                        <p style={{ color:'#9898cc', fontSize:'0.875rem', marginBottom:'1rem' }}>
                            {results.length === 0
                                ? 'No providers found for your search.'
                                : `${results.length} ${tabInfo?.label.replace(/[🏥🔧]/,'')} found`
                            }
                        </p>

                        {results.length === 0 && (
                            <div className="glass-card" style={{ padding:'3rem', textAlign:'center' }}>
                                <p style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>{type === 'hospital' ? '🏥' : '🔧'}</p>
                                <p style={{ color:'#6868a0' }}>No {type === 'hospital' ? 'hospitals' : 'garages'} found for this location.</p>
                                <p style={{ color:'#4a4a70', fontSize:'0.8125rem', marginTop:'0.375rem' }}>Try a different pincode or city name.</p>
                            </div>
                        )}

                        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
                            {results.map(p => (
                                <div key={p.id} className="glass-card" style={{ padding:'1.25rem' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = ''}
                                >
                                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start', marginBottom:'0.75rem' }}>
                                        <div style={{ flex:1 }}>
                                            <p style={{ fontWeight:700, color:'#e0e0ff', fontSize:'0.95rem', lineHeight:1.3 }}>{p.name}</p>
                                            <p style={{ fontSize:'0.75rem', color:'#6868a0', marginTop:'0.2rem', textTransform:'capitalize' }}>
                                                {type === 'hospital' ? '🏥' : '🔧'} Cashless Network {type === 'hospital' ? 'Hospital' : 'Garage'}
                                            </p>
                                        </div>
                                    </div>

                                    {p.address && (
                                        <div style={{ display:'flex', gap:'0.5rem', alignItems:'start', marginBottom:'0.5rem' }}>
                                            <span style={{ fontSize:'0.75rem', flexShrink:0, marginTop:'0.1rem' }}>📍</span>
                                            <p style={{ color:'#9898cc', fontSize:'0.8125rem', lineHeight:1.5 }}>{p.address}</p>
                                        </div>
                                    )}

                                    <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginTop:'0.75rem' }}>
                                        {p.city && (
                                            <span style={{ fontSize:'0.75rem', background:'rgba(124,58,237,0.1)', color:'#c4b5fd', padding:'0.2rem 0.625rem', borderRadius:'1rem', fontWeight:600 }}>
                                                {p.city}{p.state ? `, ${p.state}` : ''}
                                            </span>
                                        )}
                                        {p.pincode && (
                                            <span style={{ fontSize:'0.75rem', background:'rgba(124,58,237,0.06)', color:'#9898cc', padding:'0.2rem 0.625rem', borderRadius:'1rem' }}>
                                                PIN: {p.pincode}
                                            </span>
                                        )}
                                        {p.phone && (
                                            <a href={`tel:${p.phone}`} style={{ fontSize:'0.75rem', background:'rgba(34,197,94,0.12)', color:'#4ade80', padding:'0.2rem 0.625rem', borderRadius:'1rem', textDecoration:'none', fontWeight:600 }}>
                                                📞 {p.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!searched && (
                    <div className="glass-card animate-fade-in-up-delay" style={{ padding:'3rem', textAlign:'center' }}>
                        <p style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>📍</p>
                        <p style={{ color:'#9898cc', fontSize:'1rem', fontWeight:600 }}>Find Network Partners Near You</p>
                        <p style={{ color:'#6868a0', fontSize:'0.875rem', marginTop:'0.375rem' }}>
                            Search by pincode or city to find cashless hospitals & garages in your area.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
