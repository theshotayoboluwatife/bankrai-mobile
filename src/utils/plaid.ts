import { LinkSuccess, LinkExit, LinkIOSPresentationStyle, LinkLogLevel } from 'react-native-plaid-link-sdk';
import { api } from '../../config/api';

export const createLinkToken = async (userId: string) => {
  try {
    const response = await api.get(`/plaid/link_token?id=${userId}`);
    console.log('Link token response:', response.data);
    return response.data.link_token;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    console.error('Error creating link token:', error);
    throw error;
  }
};

export const exchangePublicToken = async (publicToken: string, userId: string, instituteId: string) => {
  try {
    const response = await api.post('/plaid/access_token', {
      public_token: publicToken,
      user_id: userId,
      institute_id: instituteId
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    console.error('Error exchanging public token:', error);
    throw error;
  }
}; 