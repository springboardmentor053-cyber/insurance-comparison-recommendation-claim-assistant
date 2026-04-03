import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/policy.css";

function PolicyList() {
  const [policies, setPolicies] = useState([]);
  const [selected, setSelected] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [msg, setMsg] = useState({ text: "", type: "" });

  // ── Calculator modal state 
  const [calcPolicy, setCalcPolicy] = useState(null); 
  const [age, setAge] = useState("");
  const [smoker, setSmoker] = useState(false);
  const [calculated, setCalculated] = useState(null);

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
    } catch (err) {
      const detail = err.response?.data?.detail;
      showMsg(detail || "Failed to purchase policy. Please try again.");
    }
  };

  // ── Open calculator for a specific policy 
  const openCalculator = (policy) => {
    setCalcPolicy(policy);
    setAge("");
    setSmoker(false);
    setCalculated(null);
  };

  const closeCalculator = () => {
    setCalcPolicy(null);
    setAge("");
    setSmoker(false);
    setCalculated(null);
  };

  // ── Calculate premium ──────────────────────────────────────
  const calculatePremium = () => {
    if (!age || age < 18 || age > 100) {
      showMsg("Please enter a valid age between 18 and 100.");
      return;
    }
    let base = parseFloat(calcPolicy.premium);
    let final = base;
    if (smoker) final += base * 0.1;
    if (parseInt(age) > 40) final += base * 0.05;
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
          maxWidth: "500px", margin: "0 auto 20px",
          padding: "12px 16px", borderRadius: "10px",
          textAlign: "center", fontSize: "14px", fontWeight: "500",
          background: msg.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: msg.type === "success" ? "#15803d" : "#b91c1c",
          border: `1px solid ${msg.type === "success" ? "#bbf7d0" : "#fecaca"}`
        }}>
          {msg.text}
        </div>
      )}

      {/* Filter buttons */}
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

            {/* Action buttons */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
              <button className="compare-btn" style={{ margin: 0 }} onClick={() => toggleSelect(policy)}>
                {selected.find((p) => p.id === policy.id) ? "Remove" : "Compare"}
              </button>
              <button className="buy-btn" style={{ margin: 0 }} onClick={() => purchasePolicy(policy.id)}>
                Buy Policy
              </button>
              <button
                onClick={() => openCalculator(policy)}
                style={{
                  padding: "9px 14px", border: "2px solid #1a73e8",
                  background: "white", color: "#1a73e8",
                  borderRadius: "8px", cursor: "pointer",
                  fontWeight: "500", fontSize: "13px",
                  transition: "all 0.2s ease",
                }}
                onMouseOver={(e) => { e.target.style.background = "#1a73e8"; e.target.style.color = "white"; }}
                onMouseOut={(e) => { e.target.style.background = "white"; e.target.style.color = "#1a73e8"; }}
              >
                Calculate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      {selected.length === 2 && (
        <div className="comparison-section">
          <div className="comparison-card">
            <h2 className="comparison-title">Compare Policies</h2>
            <div className="compare-table-wrapper">
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
        </div>
      )}

      {/* ── Calculator Modal ── */}
      {calcPolicy && (
        <div
          onClick={closeCalculator}
          style={{
            position: "fixed", top: 0, left: 0,
            width: "100%", height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 999,
            padding: "20px", boxSizing: "border-box",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "18px",
              padding: "32px", width: "100%", maxWidth: "420px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.2)",
              fontFamily: "'Segoe UI', sans-serif",
            }}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", color: "#1e293b" }}>
                  Premium Calculator
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748b" }}>
                  {calcPolicy.title}
                </p>
              </div>
              <button
                onClick={closeCalculator}
                style={{
                  background: "none", border: "none",
                  fontSize: "20px", cursor: "pointer",
                  color: "#94a3b8", padding: "0 4px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Base premium info */}
            <div style={{
              background: "#eff6ff", borderRadius: "10px",
              padding: "12px 16px", marginBottom: "20px",
            }}>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Base Premium</p>
              <p style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: "700", color: "#1a73e8" }}>
                ₹{parseFloat(calcPolicy.premium).toLocaleString("en-IN")}
              </p>
            </div>

            {/* Age input */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                fontSize: "12px", fontWeight: "600",
                color: "#64748b", textTransform: "uppercase",
                letterSpacing: "0.4px", display: "block", marginBottom: "6px",
              }}>
                Your Age
              </label>
              <input
                type="number"
                placeholder="Enter your age"
                value={age}
                min="18" max="100"
                onChange={(e) => { setAge(e.target.value); setCalculated(null); }}
                style={{
                  width: "100%", padding: "11px 14px",
                  borderRadius: "10px", border: "1px solid #e2e8f0",
                  fontSize: "14px", background: "#f8fafc",
                  boxSizing: "border-box", outline: "none",
                }}
              />
            </div>

            {/* Smoker checkbox */}
            <div
              onClick={() => { setSmoker(!smoker); setCalculated(null); }}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "11px 14px", borderRadius: "10px",
                border: "1px solid #e2e8f0", background: "#f8fafc",
                cursor: "pointer", marginBottom: "20px",
              }}
            >
              <input
                type="checkbox" checked={smoker}
                onChange={() => { setSmoker(!smoker); setCalculated(null); }}
                style={{ width: "16px", height: "16px", accentColor: "#1a73e8", cursor: "pointer" }}
              />
              <label style={{ fontSize: "14px", color: "#333", cursor: "pointer", fontWeight: "500" }}>
                I am a smoker (+10% premium)
              </label>
            </div>

            {/* Age > 40 info */}
            <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px", marginTop: "-10px" }}>
              Note: Age above 40 adds 5% to premium
            </p>

            {/* Calculate button */}
            <button
              onClick={calculatePremium}
              style={{
                width: "100%", padding: "13px", border: "none",
                borderRadius: "11px", fontWeight: "600", fontSize: "15px",
                cursor: "pointer", background: "linear-gradient(135deg, #2b6cb0, #4c6ef5)",
                color: "white", transition: "all 0.2s",
              }}
            >
              Calculate Premium
            </button>

            {/* Result */}
            {calculated && (
              <div style={{
                marginTop: "16px", padding: "16px",
                background: "#f0fdf4", borderRadius: "10px",
                textAlign: "center", border: "1px solid #bbf7d0",
              }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                  Estimated Annual Premium
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "26px", fontWeight: "700", color: "#15803d" }}>
                  ₹{calculated.toLocaleString("en-IN")}
                </p>
                {smoker && (
                  <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    Includes 10% smoker surcharge
                  </p>
                )}
                {parseInt(age) > 40 && (
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#94a3b8" }}>
                    Includes 5% age surcharge
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default PolicyList;