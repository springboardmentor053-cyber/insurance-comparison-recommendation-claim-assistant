import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

export default function Quote() {
    const location = useLocation();
    const navigate = useNavigate();
    const policy = location.state?.policy;

    const [loading, setLoading] = useState(false);

    if (!policy) {
        return <p>No policy selected.</p>;
    }

    const handleBuy = async () => {
        try {
            setLoading(true);

            const token = localStorage.getItem("access_token");

            await axios.post(
                `http://127.0.0.1:8000/policies/buy/${policy.id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Policy purchased successfully!");
            navigate("/my-policies");

        } catch (err) {
            alert("Purchase failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-wrapper">
            <div className="page-content">
                <h1>Policy Quote</h1>

                <div className="glass-card" style={{ padding: "1.5rem", marginTop: "1rem" }}>
                    <h2>{policy.title}</h2>
                    <p>Premium: ₹{policy.premium}</p>
                    <p>Term: {policy.term_months} months</p>
                    <p>Deductible: ₹{policy.deductible}</p>

                    <button
                        onClick={handleBuy}
                        disabled={loading}
                        className="btn-primary"
                        style={{ marginTop: "1rem" }}
                    >
                        {loading ? "Processing..." : "Buy Policy"}
                    </button>
                </div>
            </div>
        </div>
    );
}
