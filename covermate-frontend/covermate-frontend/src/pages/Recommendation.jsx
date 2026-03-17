import { useLocation, useNavigate } from "react-router-dom";

function Recommendation() {
  const location = useLocation();
  const navigate = useNavigate();

  const savedPolicies = JSON.parse(localStorage.getItem("recommendations"));

  const policies = location.state?.policies || savedPolicies;

  if (!policies) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>No recommendations found</h2>
        <button onClick={() => navigate("/")}>Go Back</button>
      </div>
    );
  }

  const purchasePolicy = async (policyId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      await fetch(`http://127.0.0.1:8000/user-policies/purchase/${policyId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Policy purchased successfully!");
    } catch (error) {
      console.error("Purchase failed", error);
      alert("Failed to purchase policy");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Recommended Policies</h2>

      {policies.map((policy) => {
        const matchPercent = Math.min(
          Math.round((policy.score / 100) * 100),
          100,
        );

        return (
          <div
            key={policy.policy_id}
            style={{
              border: "1px solid #ccc",
              padding: "20px",
              margin: "20px 0",
              borderRadius: "10px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {/* Policy Type Badge */}
            <span
              style={{
                backgroundColor: "#eef",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "bold",
              }}
            >
              {policy.policy_type?.toUpperCase()}
            </span>

            <h3 style={{ marginTop: "10px" }}>{policy.title}</h3>

            <p>
              <strong>Premium:</strong> ₹{policy.premium}
            </p>

            {/* Match Percentage */}
            <p>
              <strong>Match:</strong> {matchPercent}%
            </p>

            {/* Progress Bar */}
            <div
              style={{
                background: "#eee",
                height: "8px",
                borderRadius: "5px",
                overflow: "hidden",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: `${matchPercent}%`,
                  background: "#4CAF50",
                  height: "100%",
                }}
              ></div>
            </div>

            <p>
              <strong>Why Recommended:</strong>
            </p>

            <p>{policy.reason}</p>

            <button
              onClick={() => purchasePolicy(policy.policy_id)}
              style={{
                marginTop: "10px",
                padding: "8px 14px",
                backgroundColor: "#2ecc71",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Buy Policy
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default Recommendation;
