import { api } from '../config/api';
import { getDisplayError } from '~/utils/error';

export interface CheckoutSession {
  url: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_id: string;
  stripe_customer_id: string;
  stripe_price_id: string;
  status: 'active' | 'pending' | 'canceled' | 'unpaid';
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  updated_at: string;
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
        getDisplayError(error, 'Failed to create checkout session. Please try again.')
      );
    }
  },

  async getSubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get<Subscription>('/stripe/subscription');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Get subscription error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        getDisplayError(error, 'Failed to get subscription. Please try again.')
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
        getDisplayError(error, 'Failed to cancel subscription. Please try again.')
      );
    }
  },

}; 