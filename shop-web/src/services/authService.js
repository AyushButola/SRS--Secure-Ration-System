import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const login = async (shopId, password) => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            username: shopId,
            password,
            type: 'shop'
        });

        if (response.data.token) {
            localStorage.setItem('shop_token', response.data.token);
            localStorage.setItem('shop_user', JSON.stringify(response.data));
        }

        return response.data;
    } catch (error) {
        throw error.response?.data?.error || 'Login failed';
    }
};

const logout = () => {
    localStorage.removeItem('shop_token');
    localStorage.removeItem('shop_user');
};

const getCurrentUser = () => {
    const userStr = localStorage.getItem('shop_user');
    if (userStr) return JSON.parse(userStr);
    return null;
};

const getToken = () => {
    return localStorage.getItem('shop_token');
};

const authService = {
    login,
    logout,
    getCurrentUser,
    getToken
};

export default authService;
