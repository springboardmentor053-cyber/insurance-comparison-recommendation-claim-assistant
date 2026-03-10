import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPolicies } from '../services/policyService';

const TYPE_FILTERS = [
    { key: 'all', label: 'All Plans', icon: '📋' },
    { key: 'health', label: 'Health', icon: '🏥' },
    { key: 'life', label: 'Life', icon: '❤️' },
    { key: 'auto', label: 'Auto', icon: '🚗' },
    { key: 'home', label: 'Home', icon: '🏠' },
    { key: 'travel', label: 'Travel', icon: '✈️' },
];

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatTerm(months) {
    if (months >= 12) {
        const years = months / 12;
        return years === 1 ? '1 year' : `${years} years`;
    }
    return months === 1 ? '1 month' : `${months} months`;
}

export default function Policies() {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(null);
    const [selectedPolicies, setSelectedPolicies] = useState([]);

    useEffect(() => {
        setLoading(true);
        getPolicies(filter)
            .then(setPolicies)
            .catch(() => setPolicies([]))
            .finally(() => setLoading(false));
    }, [filter]);

    const handleSelect = (policy) => {
    const alreadySelected = selectedPolicies.find(p => p.id === policy.id);

    if (alreadySelected) {
        setSelectedPolicies(selectedPolicies.filter(p => p.id !== policy.id));
    } else {
        if (selectedPolicies.length >= 3) {
            alert("You can compare up to 3 policies only.");
            return;
        }
        setSelectedPolicies([...selectedPolicies, policy]);
    }
};


    return (
        <div className="page-wrapper">
            <div className="page-content">

                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>
                    Browse <span className="gradient-text">Insurance Policies</span>
                </h1>

                {/* Filter Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {TYPE_FILTERS.map((f) => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`chip ${filter === f.key ? 'chip-active' : ''}`}
                        >
                            {f.icon} {f.label}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {loading && <div>Loading...</div>}

                {/* Policies Grid */}
                {!loading && policies.length > 0 && (
                    <>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                                gap: '1.25rem',
                            }}
                        >
                            {policies.map((policy) => {
                                const isExpanded = expanded === policy.id;
                                const isSelected = selectedPolicies.some(p => p.id === policy.id);

                                return (
                                    <div key={policy.id} className="glass-card" style={{ padding: '1.5rem' }}>

                                        {/* Compare Checkbox */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                                {policy.policy_type}
                                            </span>

                                            <label style={{ fontSize: '0.75rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelect(policy)}
                                                    style={{ marginRight: '0.375rem' }}
                                                />
                                                Compare
                                            </label>
                                        </div>

                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
                                            {policy.title}
                                        </h3>

                                        <p style={{ marginTop: '0.5rem' }}>
                                            Premium: {formatCurrency(policy.premium)}
                                        </p>

                                        <p>
                                            Term: {formatTerm(policy.term_months)}
                                        </p>

                                        <p>
                                            Deductible: {policy.deductible > 0 ? formatCurrency(policy.deductible) : 'None'}
                                        </p>
                                        {/* Get Quote Button */}
<button
    onClick={() =>
        navigate('/quote', {
            state: { policy },
        })
    }
    style={{
        marginTop: '0.75rem',
        padding: '0.5rem 1rem',
        borderRadius: '0.5rem',
        background: '#6366f1',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontWeight: 600,
        width: '100%',
    }}
>
    Get Quote →
</button>


                                        {/* Coverage Toggle */}
                                        {policy.coverage && (
                                            <>
                                                <button
                                                    onClick={() => setExpanded(isExpanded ? null : policy.id)}
                                                    style={{
                                                        marginTop: '0.75rem',
                                                        fontSize: '0.75rem',
                                                        color: '#818cf8',
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Coverage Details {isExpanded ? '▲' : '▼'}
                                                </button>

                                                {isExpanded && (
                                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
                                                        {Object.entries(policy.coverage).map(([key, value]) => (
                                                            <div key={key}>
                                                                {key}: {String(value)}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Compare Button */}
                        {selectedPolicies.length >= 2 && (
                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                <button
                                    onClick={() =>
                                        navigate('/compare', {
                                            state: { policies: selectedPolicies },
                                        })
                                    }
                                    className="btn-primary"
                                    style={{
                                        padding: '0.75rem 1.5rem',
                                        borderRadius: '0.625rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Compare Selected Policies ({selectedPolicies.length})
                                </button>
                            </div>
                        )}
                    </>
                )}

                {!loading && policies.length === 0 && (
                    <p>No policies found.</p>
                )}
            </div>
        </div>
    );
}
