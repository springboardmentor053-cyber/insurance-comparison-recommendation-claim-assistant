import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/policy.css";

function MyPolicies() {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    axios
      .get("http://127.0.0.1:8000/user-policies/my-policies", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((res) => {
        setPolicies(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching policies", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="loading-text">Loading your policies...</p>;

  return (
    <div className="main-wrapper">
      <h2 className="page-title">My Purchased Policies</h2>

      {policies.length === 0 ? (
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <p style={{ fontSize: "16px", color: "#666" }}>
            You haven't purchased any policies yet.
          </p>
          <button
            className="buy-btn"
            style={{ marginTop: "16px" }}
            onClick={() => navigate("/policies")}
          >
            Browse Policies
          </button>
        </div>
      ) : (
        <div className="policy-container">
          {policies.map((policy) => (
            <div key={policy.user_policy_id} className="policy-card">

              {/* Policy Type Badge */}
              <span
                style={{
                  backgroundColor: "#eef2ff",
                  color: "#4f46e5",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                }}
              >
                {policy.policy_type}
              </span>

              <div className="policy-title" style={{ marginTop: "10px" }}>
                {policy.policy_title}
              </div>

              <div className="policy-premium">₹{policy.premium}</div>

              <div className="policy-details">
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      color: policy.status === "active" ? "#16a34a" : "#dc2626",
                      fontWeight: "600",
                    }}
                  >
                    {policy.status || "Active"}
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "10px", marginTop: "14px", flexWrap: "wrap" }}>
                <button
                  className="buy-btn"
                  onClick={() => navigate(`/claim/${policy.user_policy_id}`)}
                >
                  📋 File Claim
                </button>

                <button
                  className="compare-btn"
                  onClick={() => navigate(`/claim-status/${policy.user_policy_id}`)}
                >
                  🔍 View Claim Status
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyPolicies;
