import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.log('No saved token found');
                    setUser(null);
                    setLoading(false);
                    return;
                }

                // Временно отключаем проверку токена
                setUser(null);
                setLoading(false);
            } catch (err) {
                console.error('Auth check error:', err);
                setError('Authentication check failed');
                setUser(null);
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            // Временно возвращаем успешный результат без проверки
            setUser({ email, name: 'Test User' });
            localStorage.setItem('token', 'test-token');
            return true;
        } catch (err) {
            console.error('Login error:', err);
            setError('Login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setError(null);
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 