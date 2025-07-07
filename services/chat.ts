import { api } from '../config/api';

export interface Message {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  content: string;
  role: 'user' | 'model';
  chatId: string;
}

export interface Chat {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string | null;
  userId: string;
  isArchived: boolean;
  messages: Message[];
}

export const chatService = {
  async getChats(): Promise<Chat[]> {
    try {
      const response = await api.get<Chat[]>('/chats');
      return response.data;
    } catch (error: any) {
      console.error('Get chats error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch chats. Please try again.'
      );
    }
  },

  async getChat(chatId: string): Promise<Chat> {
    try {
      const response = await api.get<Chat>(`/chats/${chatId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get chat error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to fetch chat. Please try again.'
      );
    }
  },

  async createChat(): Promise<Chat> {
    try {
      const date = new Date().toISOString();
      const response = await api.post<Chat>('/chats', {
        title: `New Chat - ${date}`
      });
      return response.data;
    } catch (error: any) {
      console.error('Create chat error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create chat. Please try again.'
      );
    }
  },

  async sendMessage(chatId: string, content: string): Promise<Message> {
    try {
      const response = await api.post<Message>(`/chats/${chatId}/messages`, { content });
      return response.data;
    } catch (error: any) {
      console.error('Send message error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to send message. Please try again.'
      );
    }
  },

  async deleteChat(chatId: string): Promise<void> {
    await api.delete(`/chats/${chatId}`);
  },

  async refreshPlaidData(): Promise<void> {
    try {
      await api.get('/plaid/fetch/refresh');
    } catch (error: any) {
      console.error('Refresh Plaid data error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to refresh data. Please try again.'
      );
    }
  }
}; 