import api from './api';

// ─── Register ───
export const register = async (name, email, password, dob) => {
    const res = await api.post('/auth/register', { name, email, password, dob });
    return res.data; // { access_token, refresh_token, token_type }
};

// ─── Login ───
export const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
};

// ─── Get Current User ───
export const getMe = async () => {
    const res = await api.get('/auth/me');
    return res.data;
};

// ─── Change Password ───
export const changePassword = async (oldPassword, newPassword) => {
    const res = await api.put('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
    });
    return res.data;
};
