import axios from 'axios';
import Constants from 'expo-constants';

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

console.log('API Base URL:', getBaseUrl());

export default client;
