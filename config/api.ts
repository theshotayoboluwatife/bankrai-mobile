import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual API base URL
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Logger utility for API requests
const apiLogger = {
  request: (config: InternalAxiosRequestConfig) => {
    const { method, url, data, headers } = config;
    const timestamp = new Date().toISOString();

    console.log('\n📤 API REQUEST', timestamp);
    console.log(`   ${method?.toUpperCase()} ${config.baseURL}${url}`);

    if (headers?.Authorization) {
      console.log('   Authorization: Bearer [REDACTED]');
    }

    if (data) {
      // Redact sensitive fields in request body
      const sanitizedData = { ...data };
      if (sanitizedData.password) sanitizedData.password = '[REDACTED]';
      if (sanitizedData.token) sanitizedData.token = '[REDACTED]';
      console.log('   Body:', JSON.stringify(sanitizedData, null, 2));
    }
  },

  response: (response: AxiosResponse, duration: number) => {
    const { status, config } = response;
    const timestamp = new Date().toISOString();

    console.log('\n📥 API RESPONSE', timestamp);
    console.log(`   ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log(`   Status: ${status} | Duration: ${duration}ms`);
    console.log('   Data:', JSON.stringify(response.data, null, 2));
  },

  error: (error: AxiosError, duration: number) => {
    const timestamp = new Date().toISOString();
    const config = error.config;

    console.log('\n❌ API ERROR', timestamp);
    console.log(`   ${config?.method?.toUpperCase()} ${config?.baseURL}${config?.url}`);
    console.log(`   Status: ${error.response?.status || 'Network Error'} | Duration: ${duration}ms`);
    console.log('   Error:', error.response?.data || error.message);
  },
};

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-App-Name': 'BankrAI',
    'X-App-Version': '1.0.0',
  },
});

// Add request interceptor to add auth token and log requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Add auth token
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Store request start time for duration calculation
      (config as any).metadata = { startTime: Date.now() };

      // Log the request
      apiLogger.request(config);

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

// Add response interceptor to handle errors and log responses
api.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = Date.now() - ((response.config as any).metadata?.startTime || Date.now());

    // Log successful response
    apiLogger.response(response, duration);

    return response;
  },
  async (error: AxiosError) => {
    // Calculate request duration
    const duration = Date.now() - ((error.config as any)?.metadata?.startTime || Date.now());

    // Log error response
    apiLogger.error(error, duration);

    if (error.response?.status === 401) {
      // Handle unauthorized access (e.g., token expired)
      try {
        await AsyncStorage.removeItem('auth_token');
        console.log('Session expired, please login again');
      } catch (storageError) {
        console.error('Error removing auth token:', storageError);
      }
    }
    return Promise.reject(error);
  }
);