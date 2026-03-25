import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMe } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // On app load, check if tokens exist and fetch user data
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            getMe()
                .then((data) => setUser(data))
                .catch(() => {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // Save tokens to localStorage, fetch user info, then redirect based on role
    const saveTokensAndLoadUser = async (tokens) => {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
        const userData = await getMe();
        setUser(userData);

        // Redirect based on role
        if (userData.role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/');
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        navigate('/login');
    };

    const refreshUser = async () => {
        const userData = await getMe();
        setUser(userData);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                saveTokensAndLoadUser,
                logout,
                refreshUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);