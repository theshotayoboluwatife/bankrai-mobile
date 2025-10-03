// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User } from '../services/auth';
import { adaptyService } from '../services/adapty';
import { Platform } from 'react-native';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<User>;
  isLoading: boolean;
  isSubscribed: boolean;
  refreshSubscription: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await refreshSubscription();
    };
    init();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        const userData = await authService.getProfile();
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<User> => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) throw new Error('No authentication token found');
      const userData = await authService.getProfile();
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error('Error refreshing user data:', error);
      if (error instanceof Error && error.message.includes('authentication')) {
        await AsyncStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      }
      throw error;
    }
  };

const refreshSubscription = async (): Promise<boolean> => {
  try {
    console.log('[Auth] Refreshing user data...');
    const updatedUser = await refreshUser(); // Get the return value directly


    if (updatedUser?.hasPaidAccess) {
      console.log('[Auth] Active subscription found in database');
      setIsSubscribed(true);
      return true;
    }

    if (Platform.OS === 'ios') {
      console.log('[Auth] No database subscription, checking Adapty for iOS IAP...');
      const adaptySubscribed = await adaptyService.isSubscribed();

      if (adaptySubscribed) {

        console.log('[Auth] Active IAP found, syncing to database...');
        try {
          await authService.syncIAPSubscription();
          const syncedUser = await refreshUser(); // Refresh again after sync
          setIsSubscribed(true);
          return true;
        } catch (syncError) {
          console.error('[Auth] Failed to sync IAP subscription:', syncError);

          setIsSubscribed(false);
          return false;
        }
      }
    }

    // No active subscription found anywhere
    console.log('[Auth] No active subscription found anywhere');
    setIsSubscribed(false);
    return false;
  } catch (error) {
    console.error('[Auth] Error checking subscription status:', error);
    setIsSubscribed(false);
    return false;
  }
};

  const login = async (token: string) => {
    try {
      await AsyncStorage.setItem('auth_token', token);
      const userData = await authService.getProfile();
      setUser(userData);
      setIsAuthenticated(true);
      await refreshSubscription();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setIsSubscribed(false);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setIsAuthenticated(false);
      setIsSubscribed(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        refreshUser,
        isLoading,
        isSubscribed,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
