import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await authAPI.getMe();
        setUser(res.data);
        setLoading(false);
        return res.data;
      } catch (err) {
        console.error('Failed to fetch user', err);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
    return null;
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    localStorage.setItem('token', res.data.access_token);
    return await fetchUser();
  };

  const signup = async (data) => {
    await authAPI.signup(data);
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
