import { useEffect, useState } from "react";
import {
  getTopRecommendations,
  generateRecommendations,
} from "../services/profileService";

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const data = await getTopRecommendations();
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateRecommendations();
      await fetchRecommendations();
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-white">Loading recommendations...</div>;
  }

  return (
    <div className="p-8 min-h-screen bg-gradient-to-b from-[#0f172a] to-[#020617] text-white">
      <h1 className="text-3xl font-bold mb-4">
        Your Recommended Policies ⭐
      </h1>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="mb-6 px-6 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition"
      >
        {generating ? "Generating..." : "Generate Recommendations"}
      </button>

      {recommendations.length === 0 ? (
        <p className="text-gray-400">
          No recommendations yet. Click "Generate Recommendations".
        </p>
      ) : (
        <div className="grid gap-6">
          {recommendations.map((rec, index) => (
            <div
              key={rec.id}
              className="bg-[#1e293b] p-6 rounded-2xl shadow-lg border border-[#334155]"
            >
              {index === 0 && (
                <span className="bg-green-500 text-black px-3 py-1 rounded text-xs font-bold">
                  BEST MATCH
                </span>
              )}

              <h2 className="text-xl font-semibold mt-2 mb-2">
                {rec.policy?.title || `Policy ${rec.policy_id}`}
              </h2>

              {/* NEW: Policy Details */}
              {rec.policy && (
                <div className="text-sm text-gray-400 mb-2">
                  <p>Type: {rec.policy.policy_type}</p>
                  <p>Premium: ₹{rec.policy.premium}</p>
                </div>
              )}

              <p className="text-sm text-gray-400 mb-2">
                Score:
                <span className="text-green-400 font-semibold ml-1">
                  {rec.score}
                </span>
              </p>

              <div className="text-gray-300 mb-3">
                <p className="font-semibold mb-1">Why recommended:</p>

                <ul className="list-disc ml-6 text-sm text-gray-400">
                  {rec.reason?.split(",").map((r, i) => (
                    <li key={i}>{r.trim()}</li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-gray-500">
                Generated on:
                {new Date(rec.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations;