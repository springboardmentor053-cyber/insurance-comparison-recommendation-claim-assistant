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

// ─── Compare 2–3 Policies Side-by-Side ───
export const comparePolicies = async (ids) => {
    const res = await api.post('/policies/compare', { policy_ids: ids });
    return res.data;
};

// ─── Get a Premium Quote ───
export const getQuote = async ({ policy_id, age, coverage_amount, term_months }) => {
    const params = { policy_id, age };
    if (coverage_amount) params.coverage_amount = coverage_amount;
    if (term_months) params.term_months = term_months;
    const res = await api.get('/policies/quote', { params });
    return res.data;
};

// ─── Enroll in a Policy ───
export const enrollPolicy = async (policyId) => {
    const res = await api.post('/user-policies/', { policy_id: policyId });
    return res.data;
};

// ─── Get My Enrolled Policies ───
export const getMyPolicies = async () => {
    const res = await api.get('/user-policies/');
    return res.data;
};

// ─── Cancel a Policy ───
export const cancelPolicy = async (userPolicyId) => {
    const res = await api.delete(`/user-policies/${userPolicyId}`);
    return res.data;
};
