import api from './api';

// ── Dashboard & Stats ──
export const getAdminDashboard  = ()   => api.get('/admin/dashboard').then(r => r.data);
export const getAllClaims        = ()   => api.get('/admin/claims').then(r => r.data);
export const getAllFraudFlags    = ()   => api.get('/admin/fraud-flags').then(r => r.data);
export const exportClaimsCSV    = ()   => `${api.defaults.baseURL}/admin/claims/export`;

// ── Analytics ──
export const getAnalyticsFraudBySeverity = () =>
    api.get('/admin/analytics/fraud-by-severity').then(r => r.data);
export const getAnalyticsFlagsOverTime = () =>
    api.get('/admin/analytics/flags-over-time').then(r => r.data);
export const getAnalyticsKPIs = () =>
    api.get('/admin/analytics/kpis').then(r => r.data);

// ── Claim Actions ──
export const updateClaimStatus = (id, status) =>
    api.put(`/admin/claims/${id}/status`, { status }).then(r => r.data);
export const acceptClaim = (id) =>
    api.post(`/admin/claims/${id}/accept`).then(r => r.data);
export const rejectClaim = (id, reason) =>
    api.post(`/admin/claims/${id}/reject`, { reason }).then(r => r.data);
export const requestMoreInfo = (id, message) =>
    api.post(`/admin/claims/${id}/request-info`, { message }).then(r => r.data);
