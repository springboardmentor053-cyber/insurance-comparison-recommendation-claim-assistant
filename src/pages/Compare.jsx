import { useLocation } from "react-router-dom";

function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Compare() {
  const location = useLocation();
  const selectedPolicies = location.state?.policies || [];

  if (selectedPolicies.length < 2) {
    return (
      <div className="page-wrapper">
        <div className="page-content">
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>
            Compare Policies
          </h1>

          <div className="glass-card" style={{ padding: "2rem", marginTop: "2rem" }}>
            Please select at least 2 policies to compare.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="page-content">
        <h1 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "2rem" }}>
          Policy Comparison
        </h1>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${selectedPolicies.length}, 1fr)`,
            gap: "1rem",
          }}
        >
          {selectedPolicies.map((policy) => (
            <div key={policy.id} className="glass-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontWeight: 700 }}>{policy.title}</h3>
              <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                {policy.policy_type}
              </p>

              <hr style={{ margin: "1rem 0", opacity: 0.1 }} />

              <p>
                <strong>Premium:</strong> {formatCurrency(policy.premium)}
              </p>

              <p>
                <strong>Term:</strong> {policy.term_months} months
              </p>

              <p>
                <strong>Deductible:</strong>{" "}
                {policy.deductible > 0
                  ? formatCurrency(policy.deductible)
                  : "None"}
              </p>

              {policy.coverage && (
                <>
                  <hr style={{ margin: "1rem 0", opacity: 0.1 }} />
                  <p style={{ fontWeight: 600 }}>Coverage:</p>

                  {Object.entries(policy.coverage).map(([key, value]) => (
                    <p key={key} style={{ fontSize: "0.85rem" }}>
                      {key.replace(/_/g, " ")}:{" "}
                      {typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : value}
                    </p>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
