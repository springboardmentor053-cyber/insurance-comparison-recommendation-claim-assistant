import axios from 'axios';

// ─── Create Axios Instance ───
// All API calls go through this instance so headers and
// token refresh are handled automatically.
const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ───
// Before every request, attach the access token if available.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// ─── Response Interceptor ───
// If a request fails with 401, try to refresh the token automatically.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only try to refresh once (prevent infinite loop)
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
                try {
                    const res = await axios.post('http://localhost:8000/auth/refresh', {
                        refresh_token: refreshToken,
                    });

                    const { access_token, refresh_token: newRefresh } = res.data;
                    localStorage.setItem('access_token', access_token);
                    localStorage.setItem('refresh_token', newRefresh);

                    // Retry the original request with the new token
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return api(originalRequest);
                } catch {
                    // Refresh failed — clear tokens and redirect to login
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
