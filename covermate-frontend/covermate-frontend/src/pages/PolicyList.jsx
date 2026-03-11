// import { useEffect, useState } from "react";
// import axios from "axios";
// import "../styles/policy.css";

// function PolicyList() {
//   const [policies, setPolicies] = useState([]);
//   const [selected, setSelected] = useState([]);

//   const [age, setAge] = useState("");
//   const [smoker, setSmoker] = useState(false);
//   const [calculated, setCalculated] = useState(null);

//   // NEW: policy type filter
//   const [typeFilter, setTypeFilter] = useState("all");

//   useEffect(() => {
//     axios
//       .get("http://127.0.0.1:8000/policies")
//       .then((response) => {
//         setPolicies(response.data);
//       })
//       .catch((error) => {
//         console.error("Error fetching policies:", error);
//       });
//   }, []);

//   const toggleSelect = (policy) => {
//     if (selected.find((p) => p.id === policy.id)) {
//       setSelected(selected.filter((p) => p.id !== policy.id));
//     } else {
//       if (selected.length < 2) {
//         setSelected([...selected, policy]);
//       } else {
//         alert("You can compare only 2 policies");
//       }
//     }
//   };

//   const calculatePremium = () => {
//     if (!selected.length) {
//       alert("Select at least one policy");
//       return;
//     }

//     let base = selected[0].premium;
//     let finalPremium = base;

//     if (smoker) {
//       finalPremium += base * 0.1;
//     }

//     if (age > 40) {
//       finalPremium += base * 0.05;
//     }

//     setCalculated(Math.round(finalPremium));
//   };

//   // POLICY FILTER LOGIC
//   const filteredPolicies =
//     typeFilter === "all"
//       ? policies
//       : policies.filter((p) => p.policy_type === typeFilter);

//   // BEST VALUE LOGIC

//   let bestPolicyIndex = null;

//   if (selected.length === 2) {
//     const p1 = selected[0];
//     const p2 = selected[1];

//     const premiumScore1 = p2.premium / (p1.premium + p2.premium);
//     const premiumScore2 = p1.premium / (p1.premium + p2.premium);

//     const deductibleScore1 = p2.deductible / (p1.deductible + p2.deductible);
//     const deductibleScore2 = p1.deductible / (p1.deductible + p2.deductible);

//     const termScore1 = p1.term_months / (p1.term_months + p2.term_months);
//     const termScore2 = p2.term_months / (p1.term_months + p2.term_months);

//     const score1 =
//       premiumScore1 * 0.4 + deductibleScore1 * 0.3 + termScore1 * 0.3;

//     const score2 =
//       premiumScore2 * 0.4 + deductibleScore2 * 0.3 + termScore2 * 0.3;

//     bestPolicyIndex = score1 > score2 ? 0 : 1;
//   }

//   return (
//     <div className="main-wrapper">
//       <h1 className="page-title">Insurance Policy Catalog</h1>

//       {/* POLICY TYPE FILTER */}
//       <div className="filter-buttons">
//         <button onClick={() => setTypeFilter("all")}>All</button>
//         <button onClick={() => setTypeFilter("health")}>Health</button>
//         <button onClick={() => setTypeFilter("life")}>Life</button>
//         <button onClick={() => setTypeFilter("auto")}>Auto</button>
//         <button onClick={() => setTypeFilter("travel")}>Travel</button>
//       </div>

//       {/* POLICY CARDS */}
//       <div className="policy-container">
//         {filteredPolicies.map((policy) => (
//           <div className="policy-card" key={policy.id}>
//             <div className="policy-title">{policy.title}</div>
//             <div className="policy-type">Type: {policy.policy_type}</div>

//             <div className="policy-premium">₹{policy.premium}</div>

//             <div className="policy-details">
//               <p>Term: {policy.term_months} months</p>
//               <p>Deductible: ₹{policy.deductible}</p>
//             </div>

//             <button
//               className="compare-btn"
//               onClick={() => toggleSelect(policy)}
//             >
//               {selected.find((p) => p.id === policy.id) ? "Remove" : "Compare"}
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* COMPARISON TABLE */}

//       {selected.length === 2 && (
//         <div className="comparison-section">
//           <div className="comparison-card">
//             <h2 className="comparison-title">Compare Policies</h2>

//             <table className="compare-table">
//               <thead>
//                 <tr>
//                   <th>Feature</th>

//                   <th
//                     className={`policy-col ${
//                       bestPolicyIndex === 0 ? "highlight-col" : ""
//                     }`}
//                   >
//                     {selected[0].title}
//                     {bestPolicyIndex === 0 && (
//                       <div className="badge best-badge">Best Value</div>
//                     )}
//                   </th>

//                   <th
//                     className={`policy-col ${
//                       bestPolicyIndex === 1 ? "highlight-col" : ""
//                     }`}
//                   >
//                     {selected[1].title}
//                     {bestPolicyIndex === 1 && (
//                       <div className="badge best-badge">Best Value</div>
//                     )}
//                   </th>
//                 </tr>
//               </thead>

//               <tbody>
//                 <tr>
//                   <td className="feature-name">Premium</td>

//                   <td
//                     className={`premium ${
//                       bestPolicyIndex === 0 ? "highlight-text" : ""
//                     }`}
//                   >
//                     ₹{selected[0].premium}
//                   </td>

//                   <td
//                     className={`premium ${
//                       bestPolicyIndex === 1 ? "highlight-text" : ""
//                     }`}
//                   >
//                     ₹{selected[1].premium}
//                   </td>
//                 </tr>

//                 <tr>
//                   <td className="feature-name">Term</td>
//                   <td>{selected[0].term_months} months</td>
//                   <td>{selected[1].term_months} months</td>
//                 </tr>

//                 <tr>
//                   <td className="feature-name">Deductible</td>
//                   <td>₹{selected[0].deductible}</td>
//                   <td>₹{selected[1].deductible}</td>
//                 </tr>

//                 <tr>
//                   <td className="feature-name">Type</td>
//                   <td>{selected[0].policy_type}</td>
//                   <td>{selected[1].policy_type}</td>
//                 </tr>
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}

//       {/* PREMIUM CALCULATOR */}
//       <div className="calculator-section">
//         <h2>Premium Calculator</h2>

//         <div className="calculator-inputs">
//           <input
//             type="number"
//             placeholder="Enter Age"
//             value={age}
//             onChange={(e) => setAge(e.target.value)}
//           />

//           <label>
//             <input
//               type="checkbox"
//               checked={smoker}
//               onChange={() => setSmoker(!smoker)}
//             />
//             Smoker
//           </label>
//         </div>

//         <button onClick={calculatePremium} className="compare-btn">
//           Calculate Premium
//         </button>

//         {calculated && (
//           <h3 className="result">Estimated Premium: ₹{calculated}</h3>
//         )}
//       </div>
//     </div>
//   );
// }

// export default PolicyList;



import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/policy.css";

function PolicyList() {
  const [policies, setPolicies] = useState([]);
  const [selected, setSelected] = useState([]);

  const [age, setAge] = useState("");
  const [smoker, setSmoker] = useState(false);
  const [calculated, setCalculated] = useState(null);

  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/policies")
      .then((response) => {
        setPolicies(response.data);
      })
      .catch((error) => {
        console.error("Error fetching policies:", error);
      });
  }, []);

  const toggleSelect = (policy) => {
    if (selected.find((p) => p.id === policy.id)) {
      setSelected(selected.filter((p) => p.id !== policy.id));
    } else {
      if (selected.length < 2) {
        setSelected([...selected, policy]);
      } else {
        alert("You can compare only 2 policies");
      }
    }
  };

  const calculatePremium = () => {
    if (!selected.length) {
      alert("Select at least one policy");
      return;
    }

    let base = selected[0].premium;
    let finalPremium = base;

    if (smoker) {
      finalPremium += base * 0.1;
    }

    if (age > 40) {
      finalPremium += base * 0.05;
    }

    setCalculated(Math.round(finalPremium));
  };

  // PURCHASE POLICY FUNCTION
  const purchasePolicy = async (policyId) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first");
      return;
    }

    try {
      await axios.post(
        `http://127.0.0.1:8000/user-policies/purchase/${policyId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Policy purchased successfully!");
    } catch (error) {
      console.error("Purchase error:", error);
      alert("Failed to purchase policy");
    }
  };

  const filteredPolicies =
    typeFilter === "all"
      ? policies
      : policies.filter((p) => p.policy_type === typeFilter);

  let bestPolicyIndex = null;

  if (selected.length === 2) {
    const p1 = selected[0];
    const p2 = selected[1];

    const premiumScore1 = p2.premium / (p1.premium + p2.premium);
    const premiumScore2 = p1.premium / (p1.premium + p2.premium);

    const deductibleScore1 = p2.deductible / (p1.deductible + p2.deductible);
    const deductibleScore2 = p1.deductible / (p1.deductible + p2.deductible);

    const termScore1 = p1.term_months / (p1.term_months + p2.term_months);
    const termScore2 = p2.term_months / (p1.term_months + p2.term_months);

    const score1 =
      premiumScore1 * 0.4 + deductibleScore1 * 0.3 + termScore1 * 0.3;

    const score2 =
      premiumScore2 * 0.4 + deductibleScore2 * 0.3 + termScore2 * 0.3;

    bestPolicyIndex = score1 > score2 ? 0 : 1;
  }

  return (
    <div className="main-wrapper">
      <h1 className="page-title">Insurance Policy Catalog</h1>

      <div className="filter-buttons">
        <button onClick={() => setTypeFilter("all")}>All</button>
        <button onClick={() => setTypeFilter("health")}>Health</button>
        <button onClick={() => setTypeFilter("life")}>Life</button>
        <button onClick={() => setTypeFilter("auto")}>Auto</button>
        <button onClick={() => setTypeFilter("travel")}>Travel</button>
      </div>

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

            <button
              className="compare-btn"
              onClick={() => toggleSelect(policy)}
            >
              {selected.find((p) => p.id === policy.id)
                ? "Remove"
                : "Compare"}
            </button>

            {/* BUY POLICY BUTTON */}
            <button
              className="buy-btn"
              onClick={() => purchasePolicy(policy.id)}
            >
              Buy Policy
            </button>
          </div>
        ))}
      </div>

      {selected.length === 2 && (
        <div className="comparison-section">
          <div className="comparison-card">
            <h2 className="comparison-title">Compare Policies</h2>

            <table className="compare-table">
              <thead>
                <tr>
                  <th>Feature</th>

                  <th
                    className={`policy-col ${
                      bestPolicyIndex === 0 ? "highlight-col" : ""
                    }`}
                  >
                    {selected[0].title}
                    {bestPolicyIndex === 0 && (
                      <div className="badge best-badge">Best Value</div>
                    )}
                  </th>

                  <th
                    className={`policy-col ${
                      bestPolicyIndex === 1 ? "highlight-col" : ""
                    }`}
                  >
                    {selected[1].title}
                    {bestPolicyIndex === 1 && (
                      <div className="badge best-badge">Best Value</div>
                    )}
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="feature-name">Premium</td>

                  <td
                    className={`premium ${
                      bestPolicyIndex === 0 ? "highlight-text" : ""
                    }`}
                  >
                    ₹{selected[0].premium}
                  </td>

                  <td
                    className={`premium ${
                      bestPolicyIndex === 1 ? "highlight-text" : ""
                    }`}
                  >
                    ₹{selected[1].premium}
                  </td>
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

      <div className="calculator-section">
        <h2>Premium Calculator</h2>

        <div className="calculator-inputs">
          <input
            type="number"
            placeholder="Enter Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />

          <label>
            <input
              type="checkbox"
              checked={smoker}
              onChange={() => setSmoker(!smoker)}
            />
            Smoker
          </label>
        </div>

        <button onClick={calculatePremium} className="compare-btn">
          Calculate Premium
        </button>

        {calculated && (
          <h3 className="result">Estimated Premium: ₹{calculated}</h3>
        )}
      </div>
    </div>
  );
}

export default PolicyList;

