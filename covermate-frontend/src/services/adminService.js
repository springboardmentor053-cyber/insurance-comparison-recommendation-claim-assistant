import api from './api';

// ─── Dashboard Stats ───
export const getAdminDashboard = async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
};

// ─── All Claims ───
export const getAllClaims = async () => {
    const res = await api.get('/admin/claims');
    return res.data;
};

// ─── Update Claim Status ───
export const updateClaimStatus = async (claimId, newStatus) => {
    const res = await api.put(`/admin/claims/${claimId}/status`, { status: newStatus });
    return res.data;
};

// ─── Fraud Flags ───
export const getFraudFlags = async () => {
    const res = await api.get('/admin/fraud-flags');
    return res.data;
};

// ─── Export Claims CSV ───
export const exportClaimsCSV = async () => {
    const res = await api.get('/admin/claims/export', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'claims_export.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
