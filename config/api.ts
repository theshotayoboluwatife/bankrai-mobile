import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Name': 'BankrAI',
    'X-App-Version': '1.0.0',
  },
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return Promise.reject(error);
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., token expired)
      try {
        await AsyncStorage.removeItem('auth_token');
        // You might want to trigger a logout here or show a login screen
        console.log('Session expired, please login again');
      } catch (storageError) {
        console.error('Error removing auth token:', storageError);
      }
    }
    return Promise.reject(error);
  }
);