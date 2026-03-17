import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/policy.css";

function PolicyList() {
  const [policies, setPolicies] = useState([]);
  const [selected, setSelected] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [age, setAge] = useState("");
  const [smoker, setSmoker] = useState(false);
  const [calculated, setCalculated] = useState(null);
  const [msg, setMsg] = useState({ text: "", type: "" });

  const showMsg = (text, type = "error") => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/policies")
      .then((res) => setPolicies(res.data))
      .catch(() => {});
  }, []);

  const toggleSelect = (policy) => {
    if (selected.find((p) => p.id === policy.id)) {
      setSelected(selected.filter((p) => p.id !== policy.id));
    } else {
      if (selected.length < 2) {
        setSelected([...selected, policy]);
      } else {
        showMsg("You can compare only 2 policies at a time.");
      }
    }
  };

  const purchasePolicy = async (policyId) => {
    const token = localStorage.getItem("token");
    if (!token) { showMsg("Please login first to purchase a policy."); return; }
    try {
      await axios.post(
        `http://127.0.0.1:8000/user-policies/purchase/${policyId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showMsg("Policy purchased successfully!", "success");
    } catch {
      showMsg("Failed to purchase policy. Please try again.");
    }
  };

  const calculatePremium = () => {
    if (!selected.length) {
      showMsg("Please select at least one policy first.");
      return;
    }
    let base = selected[0].premium;
    let final = base;
    if (smoker) final += base * 0.1;
    if (age > 40) final += base * 0.05;
    setCalculated(Math.round(final));
  };

  const filteredPolicies =
    typeFilter === "all" ? policies : policies.filter((p) => p.policy_type === typeFilter);

  let bestPolicyIndex = null;
  if (selected.length === 2) {
    const [p1, p2] = selected;
    const s1 =
      (p2.premium / (p1.premium + p2.premium)) * 0.4 +
      (p2.deductible / (p1.deductible + p2.deductible)) * 0.3 +
      (p1.term_months / (p1.term_months + p2.term_months)) * 0.3;
    const s2 =
      (p1.premium / (p1.premium + p2.premium)) * 0.4 +
      (p1.deductible / (p1.deductible + p2.deductible)) * 0.3 +
      (p2.term_months / (p1.term_months + p2.term_months)) * 0.3;
    bestPolicyIndex = s1 > s2 ? 0 : 1;
  }

  return (
    <div className="main-wrapper">
      <h1 className="page-title">Insurance Policy Catalog</h1>

      {/* Inline notification */}
      {msg.text && (
        <div style={{
          maxWidth: "500px", margin: "0 auto 20px", padding: "12px 16px",
          borderRadius: "10px", textAlign: "center", fontSize: "14px", fontWeight: "500",
          background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: msg.type === "success" ? "#15803d" : "#b91c1c",
          border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`
        }}>
          {msg.text}
        </div>
      )}

      {/* Filter buttons — pill style, active state handled inline */}
      <div className="filter-buttons">
        {["all", "health", "life", "auto", "travel", "home"].map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            style={typeFilter === type ? { background: "#1a73e8", color: "white" } : {}}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Policy cards */}
      <div className="policy-container">
        {filteredPolicies.map((policy) => (
          <div className="policy-card" key={policy.id}>
            <div className="policy-title">{policy.title}</div>
            <div className="policy-type">Type: {policy.policy_type}</div>
            <div className="policy-premium">₹{policy.premium}</div>
            <div className="policy-details">
              <p>Term: {policy.term_months} months</p>
              <p>Deductible: ₹{policy.deductible}</p>
            </div>
            <button className="compare-btn" onClick={() => toggleSelect(policy)}>
              {selected.find((p) => p.id === policy.id) ? "Remove" : "Compare"}
            </button>
            <button className="buy-btn" onClick={() => purchasePolicy(policy.id)}>
              Buy Policy
            </button>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      {selected.length === 2 && (
        <div className="comparison-section">
          <div className="comparison-card">
            <h2 className="comparison-title">Compare Policies</h2>
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th className={bestPolicyIndex === 0 ? "highlight-col" : ""}>
                    {selected[0].title}
                    {bestPolicyIndex === 0 && <div className="badge best-badge">Best Value</div>}
                  </th>
                  <th className={bestPolicyIndex === 1 ? "highlight-col" : ""}>
                    {selected[1].title}
                    {bestPolicyIndex === 1 && <div className="badge best-badge">Best Value</div>}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="feature-name">Premium</td>
                  <td className={`premium ${bestPolicyIndex === 0 ? "highlight-text" : ""}`}>₹{selected[0].premium}</td>
                  <td className={`premium ${bestPolicyIndex === 1 ? "highlight-text" : ""}`}>₹{selected[1].premium}</td>
                </tr>
                <tr>
                  <td className="feature-name">Term</td>
                  <td>{selected[0].term_months} months</td>
                  <td>{selected[1].term_months} months</td>
                </tr>
                <tr>
                  <td className="feature-name">Deductible</td>
                  <td>₹{selected[0].deductible}</td>
                  <td>₹{selected[1].deductible}</td>
                </tr>
                <tr>
                  <td className="feature-name">Type</td>
                  <td>{selected[0].policy_type}</td>
                  <td>{selected[1].policy_type}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Premium Calculator */}
      <div className="calculator-section">
        <h2>Premium Calculator</h2>
        <div className="calculator-inputs">
          <div className="calc-field">
            <label className="calc-label">Your Age</label>
            <input
              type="number"
              className="calc-input"
              placeholder="Enter your age"
              value={age}
              min="18" max="100"
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <div className="calc-checkbox-row" onClick={() => setSmoker(!smoker)}>
            <input type="checkbox" checked={smoker} onChange={() => setSmoker(!smoker)} />
            <label>I am a smoker (adds 10% to premium)</label>
          </div>
        </div>
        <button className="compare-btn" style={{ width: "100%" }} onClick={calculatePremium}>
          Calculate Premium
        </button>
        {calculated && (
          <div className="result">
            Estimated Premium: ₹{calculated.toLocaleString("en-IN")}
          </div>
        )}
      </div>
    </div>
  );
}

export default PolicyList;