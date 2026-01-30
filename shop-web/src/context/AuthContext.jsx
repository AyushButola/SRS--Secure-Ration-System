import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
        setLoading(false);
    }, []);

    const login = async (shopId, password) => {
        const data = await authService.login(shopId, password);
        setCurrentUser(data);
        return data;
    };

    const logout = () => {
        authService.logout();
        setCurrentUser(null);
    };

    const getToken = () => {
        return authService.getToken();
    };

    return (
        <AuthContext.Provider value={{ currentUser, login, logout, loading, getToken }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
