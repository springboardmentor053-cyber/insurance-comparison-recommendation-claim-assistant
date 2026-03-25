import api from "./api";

// ─── Get Profile ───
export const getProfile = async () => {
  const res = await api.get("/profile/");
  return res.data;
};

// ─── Update Profile ───
export const updateProfile = async (data) => {
  const res = await api.put("/profile/", data);
  return res.data;
};

// ─── Get Risk Profile ───
export const getRiskProfile = async () => {
  const res = await api.get("/profile/risk-profile");
  return res.data;
};

// ─── Update Risk Profile ───
export const updateRiskProfile = async (riskProfile) => {
  const res = await api.put("/profile/risk-profile", {
    risk_profile: riskProfile,
  });
  return res.data;
};

// ─── Get All Recommendations ───
export const getRecommendations = async () => {
  const res = await api.get("/profile/recommendations");
  return res.data;
};

// ─── Get Top Recommendations (Best Matches) ───
export const getTopRecommendations = async () => {
  const res = await api.get("/profile/recommendations/top");
  return res.data;
};

// ─── Generate Recommendations ───
export const generateRecommendations = async () => {
  const res = await api.post("/profile/generate-recommendations");
  return res.data;
};