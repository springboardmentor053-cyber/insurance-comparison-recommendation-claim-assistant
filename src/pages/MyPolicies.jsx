import { useEffect, useState } from 'react';
import axios from 'axios';

export default function MyPolicies() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPolicies = async () => {
        try {
            const token = localStorage.getItem("access_token");

            const res = await axios.get(
                "http://127.0.0.1:8000/policies/my",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setPolicies(res.data);
        } catch (err) {
            console.log("Error loading policies");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        try {
            const token = localStorage.getItem("access_token");

            await axios.put(
                `http://127.0.0.1:8000/policies/cancel/${id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Policy cancelled");
            fetchPolicies();
        } catch (err) {
            alert("Cancel failed");
        }
    };

    useEffect(() => {
        fetchPolicies();
    }, []);

    if (loading) return <p>Loading...</p>;

    return (
        <div className="page-wrapper">
            <div className="page-content">
                <h1>My Policies</h1>

                {policies.length === 0 && <p>No policies purchased yet.</p>}

                {policies.map((p) => (
                    <div
                        key={p.id}
                        className="glass-card"
                        style={{ padding: "1.5rem", marginTop: "1rem" }}
                    >
                        <h3>{p.policy.title}</h3>
                        <p>Policy Number: {p.policy_number}</p>
                        <p>Premium: ₹{p.premium}</p>
                        <p>Status: {p.status}</p>
                        <p>Start Date: {p.start_date}</p>
                        <p>End Date: {p.end_date}</p>

                        {p.status === "active" && (
                            <button
                                onClick={() => handleCancel(p.id)}
                                style={{
                                    marginTop: "1rem",
                                    padding: "0.5rem 1rem",
                                    background: "#ef4444",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "0.5rem",
                                    cursor: "pointer"
                                }}
                            >
                                Cancel Policy
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
