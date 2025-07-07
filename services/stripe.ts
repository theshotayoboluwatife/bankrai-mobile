import { api } from '../config/api';

export interface CheckoutSession {
  url: string;
}

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripePriceId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'inactive' | 'canceled';
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  userId: string;
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export const stripeService = {
  async createCheckoutSession(priceId: string): Promise<CheckoutSession> {
    try {
      const response = await api.post<CheckoutSession>('/stripe/create-checkout-session', {
        priceId,
      });
      return response.data;
    } catch (error: any) {
      console.error('Create checkout session error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create checkout session. Please try again.'
      );
    }
  },

  async getSubscription(): Promise<Subscription> {
    try {
      const response = await api.get<Subscription>('/stripe/subscription');
      return response.data;
    } catch (error: any) {
      console.error('Get subscription error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to get subscription. Please try again.'
      );
    }
  },

  async cancelSubscription(): Promise<void> {
    try {
      await api.post('/stripe/cancel-subscription');
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

  async createPortalSession(): Promise<{ url: string }> {
    try {
      const response = await api.post<{ url: string }>('/stripe/create-portal-session');
      return response.data;
    } catch (error: any) {
      console.error('Create portal session error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create portal session. Please try again.'
      );
    }
  }
}; 