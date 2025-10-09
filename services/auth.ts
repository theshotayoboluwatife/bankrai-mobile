import { api } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  fullName: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  plaidIntegration: PlaidIntegration | null;
  hasPaidAccess: boolean;
  messageCount: number;
  subscription?: {
    id: string;
    status: string;
    stripeSubscriptionId: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export interface PlaidIntegration {
  id: string;
  userId: string;
  plaidAccessToken: string;
  plaidItemId: string;
  plaidInstitutionId: string;
}

export interface AuthResponse {
  user: User;
  session: any; // We'll keep this as any since we don't know the exact session type
}

export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/login', credentials);
      console.log('login', response.status, response.data);
      return response.data;
    } catch (error: any) {
      console.log('login', error);
      console.error('Login error:', error.response?.status, error.response?.data, error.message);

      throw new Error(
        error.response?.status ||
        error.message ||
        'Failed to login. Please check your credentials and try again.'
      );
    }
  },


  async signup(data: SignupData): Promise<AuthResponse> {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', data);
      return response.data;
    } catch (error: any) {

      console.log('signup', error);

      console.error('Signup error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to create account. Please try again.'
      );
    }
  },

  async logout(): Promise<void> {
    try {
      // Clear the token from storage
      await AsyncStorage.removeItem('auth_token');
    } catch (error: any) {
      console.error('Logout error:', {
        message: error.message
      });
      // Don't throw error on logout failure
    }
  },

  async getProfile(): Promise<AuthResponse['user']> {
    try {
      const response = await api.get<AuthResponse['user']>('/users/me');
      console.log('profile teurned', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Get profile error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch profile. Please try again.'
      );
    }
  },

  async getUserById(userId: string): Promise<AuthResponse['user']> {
    try {
      const response = await api.get<AuthResponse['user']>(`/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get user error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch user. Please try again.'
      );
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      await api.delete(`/users/${userId}`);
    } catch (error: any) {
      console.error('Delete user error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to delete account. Please try again.'
      );
    }
  },

  async getCurrentUser(): Promise<AuthResponse['user']> {
    try {
      const response = await api.get<AuthResponse['user']>('/users/me');
      return response.data;
    } catch (error: any) {
      console.error('Get current user error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch current user. Please try again.'
      );
    }
  },

  async updateUser(userData: Partial<User>): Promise<AuthResponse['user']> {
    try {
      const response = await api.patch<AuthResponse['user']>('/users/me', userData);
      return response.data;
    } catch (error: any) {
      console.error('Update user error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to update user. Please try again.'
      );
    }
  },

  async fetchPlaidData(): Promise<void> {
    try {
      const response = await api.get('/plaid/fetch');
      return response.data;
    } catch (error: any) {
      console.error('Fetch Plaid data error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch Plaid data. Please try again.'
      );
    }
  },

  async disconnectPlaid(): Promise<void> {
    try {
      await api.delete('/plaid/disconnect');
    } catch (error: any) {
      console.error('Disconnect Plaid error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to disconnect Plaid. Please try again.'
      );
    }
  },


  async cancelSubscription(): Promise<void> {
    try {
      const response = await api.post('/stripe/cancel-subscription');
      return response.data;
    } catch (error: any) {
      console.error('Cancel subscription error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        error.response?.data?.message ||
        error.message ||
        'Failed to cancel subscription. Please try again.'
      );
    }
  },

 async syncIAPSubscription(userData: Partial<User>): Promise<void> {
   try {
       const user = await authService.getCurrentUser();
    const response = await api.post(`/users/${user.id}/sync-iap-subscription`);
    console.log(response.status);
    console.log(response.data);
     return response.data;
   } catch (error: any) {
     console.error('Sync IAP subscription error:', {
       status: error.response?.status,
       data: error.response?.data,
       message: error.message
     });

     throw new Error(
       error.response?.data?.message ||
       error.message ||
       'Failed to sync IAP subscription. Please try again.'
     );
   }
 }

};