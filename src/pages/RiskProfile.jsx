import { useState } from "react";
import {
  updateRiskProfile,
  generateRecommendations,
} from "../services/profileService";

const RiskProfile = () => {
  const [policyType, setPolicyType] = useState("");
  const [budget, setBudget] = useState("");
  const [riskAppetite, setRiskAppetite] = useState(2);
  const [coverage, setCoverage] = useState("");
  const [loading, setLoading] = useState(false);

  const [income, setIncome] = useState("");
  const [familySize, setFamilySize] = useState("");
  const [smoker, setSmoker] = useState(false);
  const [conditions, setConditions] = useState([]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const riskProfile = {
        income: Number(income),
        family_size: Number(familySize),
        smoker: smoker,
        existing_conditions: conditions.filter((c) => c.trim() !== ""),
        risk_appetite:
          Number(riskAppetite) === 1
            ? "low"
            : Number(riskAppetite) === 2
            ? "medium"
            : "high",
        coverage_priority: coverage,
        preferred_types: policyType ? [policyType] : [],
        budget_limit: Number(budget),
      };

      await updateRiskProfile(riskProfile);
      await generateRecommendations();

      alert("Risk profile saved & recommendations generated!");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const policies = [
    { value: "health", label: "Health Insurance" },
    { value: "life", label: "Life Insurance" },
    { value: "auto", label: "Auto Insurance" },
    { value: "travel", label: "Travel Insurance" },
    { value: "home", label: "Home Insurance" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f172a] to-[#020617] flex justify-center pt-16 text-white">
      <div className="w-full max-w-xl bg-[#1e293b] px-10 py-10 rounded-2xl shadow-xl border border-[#334155]">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Set Your Risk Profile
          </h1>
          <p className="text-gray-400 text-sm">
            Help us recommend the best insurance policies for you
          </p>
        </div>

        {/* Income */}
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-2">
            Annual Income (₹)
          </label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            placeholder="Example: 600000"
            className="w-full p-3 rounded-lg bg-[#0f172a] border border-[#334155] focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Family Size */}
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-2">
            Family Size
          </label>
          <input
            type="number"
            value={familySize}
            onChange={(e) => setFamilySize(e.target.value)}
            placeholder="Example: 3"
            className="w-full p-3 rounded-lg bg-[#0f172a] border border-[#334155] focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Smoker */}
        <div className="mb-6">
          <label className="block text-gray-400 text-sm mb-2">
            Smoking Habit
          </label>
          <select
            value={smoker}
            onChange={(e) => setSmoker(e.target.value === "true")}
            className="w-full p-3 rounded-lg bg-[#0f172a] border border-[#334155]"
          >
            <option value="false">Non-Smoker</option>
            <option value="true">Smoker</option>
          </select>
        </div>

        {/* Existing Conditions */}
        <div className="mb-8">
          <label className="block text-gray-400 text-sm mb-2">
            Existing Conditions
          </label>
          <input
            type="text"
            placeholder="Example: diabetes,asthma"
            onChange={(e) => setConditions(e.target.value.split(","))}
            className="w-full p-3 rounded-lg bg-[#0f172a] border border-[#334155]"
          />
        </div>

        {/* Policy Type */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">
            Select Policy Type
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {policies.map((p) => (
              <button
                key={p.value}
                onClick={() => setPolicyType(p.value)}
                className={`py-2 px-3 rounded-lg text-sm border transition ${
                  policyType === p.value
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "bg-[#0f172a] border-[#334155] hover:border-indigo-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div className="mb-8">
          <label className="block text-gray-400 text-sm mb-2">
            Budget Limit (₹)
          </label>

          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Example: 20000"
            className="w-full p-3 rounded-lg bg-[#0f172a] border border-[#334155]"
          />
        </div>

        {/* Risk Appetite */}
        <div className="mb-8">
          <label className="block text-gray-400 text-sm mb-3">
            Risk Appetite
          </label>

          <input
            type="range"
            min="1"
            max="3"
            value={riskAppetite}
            onChange={(e) => setRiskAppetite(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />

          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>Low Risk</span>
            <span>Balanced</span>
            <span>High Risk</span>
          </div>
        </div>

        {/* Coverage */}
        <div className="mb-10">
          <label className="block text-gray-400 text-sm mb-2">
            Coverage Priority
          </label>

          <select
            value={coverage}
            onChange={(e) => setCoverage(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#0f172a] border border-[#334155]"
          >
            <option value="">Select Coverage Level</option>
            <option value="low">Basic Coverage</option>
            <option value="medium">Balanced Coverage</option>
            <option value="high">Maximum Coverage</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-12 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition font-semibold shadow-lg"
          >
            {loading ? "Generating..." : "Save & Generate Recommendations"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default RiskProfile;