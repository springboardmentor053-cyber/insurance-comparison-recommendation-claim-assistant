import axios from 'axios';

const api = axios.create();

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  signup: (userData) => api.post('/auth/signup', userData),
  login: (credentials) => {
    const form = new URLSearchParams();
    form.append('username', credentials.email);
    form.append('password', credentials.password);
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  },
  getMe: () => api.get('/auth/me')
};

export const policyAPI = {
  getPolicies: () => api.get('/policies')
};

export const claimsAPI = {
  getClaims: () => api.get('/claims'),
  getClaim: (id) => api.get(`/claims/${id}`),
  fileClaim: (claimData) => api.post('/claims', claimData),
  submitClaim: (id) => api.post(`/claims/${id}/submit`),
  uploadDocument: (id, file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/claims/${id}/upload?file_type=${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  getDocuments: (id) => api.get(`/claims/${id}/documents`),
  getHistory: (id) => api.get(`/claims/${id}/history`)
};

export const recommendationsAPI = {
  generate: () => api.post('/recommendations/generate'),
  get: () => api.get('/recommendations')
};

export const preferencesAPI = {
  get: () => api.get('/preferences'),
  update: (data) => api.post('/preferences', data)
};

export default api;
