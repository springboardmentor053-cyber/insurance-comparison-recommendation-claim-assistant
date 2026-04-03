import api from './api';

// Create a new claim (draft)
export const createClaim = async (claimData) => {
    const res = await api.post('/claims/', claimData);
    return res.data;
};

// Get all claims for the current user
export const getMyClaims = async () => {
    const res = await api.get('/claims/');
    return res.data;
};

// Get a single claim by ID
export const getClaim = async (claimId) => {
    const res = await api.get(`/claims/${claimId}`);
    return res.data;
};

// Edit a claim (draft/submitted only)
export const updateClaim = async (claimId, data) => {
    const res = await api.put(`/claims/${claimId}`, data);
    return res.data;
};

// Final submission — validates required doc types
export const submitClaim = async (claimId) => {
    const res = await api.post(`/claims/${claimId}/submit`);
    return res.data;
};

// Upload a document with structured doc_type
export const uploadClaimDocument = async (claimId, file, docType = 'other') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('doc_type', docType);

    const res = await api.post(`/claims/${claimId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
};

// Delete a document
export const deleteClaimDocument = async (docId) => {
    const res = await api.delete(`/claims/documents/${docId}`);
    return res.data;
};
