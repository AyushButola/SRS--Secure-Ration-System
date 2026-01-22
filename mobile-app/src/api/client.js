import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dynamically determine the backend URL
// For Android Emulator, localhost is 10.0.2.2
// For Physical Device, use the LAN IP of the computer
const getBaseUrl = () => {
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost?.split(':')[0] || 'localhost';

    // Default to port 3000
    return `http://${localhost}:3000/api`;
};

const client = axios.create({
    baseURL: getBaseUrl(),
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add Request Interceptor to attach Token
client.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

console.log('API Base URL:', getBaseUrl());

export default client;
