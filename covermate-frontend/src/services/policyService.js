import api from './api';

// ─── Get All Policies (optionally filter by type) ───
export const getPolicies = async (policyType) => {
    const params = {};
    if (policyType && policyType !== 'all') {
        params.policy_type = policyType;
    }
    const res = await api.get('/policies/', { params });
    return res.data;
};

// ─── Get Single Policy ───
export const getPolicy = async (id) => {
    const res = await api.get(`/policies/${id}`);
    return res.data;
};
