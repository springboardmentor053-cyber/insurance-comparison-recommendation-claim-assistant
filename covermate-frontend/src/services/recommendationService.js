import api from './api';

// ─── Generate Recommendations (triggers scoring engine) ───
export const generateRecommendations = async () => {
    const res = await api.post('/recommendations/generate');
    return res.data;
};

// ─── Get Precomputed Recommendations ───
export const getRecommendations = async () => {
    const res = await api.get('/recommendations/');
    return res.data;
};
