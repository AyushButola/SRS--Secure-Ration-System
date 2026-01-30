import axios from 'axios';

const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
console.log('API Base URL:', apiURL);

const client = axios.create({
    baseURL: apiURL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add Request Interceptor
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default client;
