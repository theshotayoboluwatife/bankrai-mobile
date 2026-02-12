import { api } from '../config/api';
import { getDisplayError } from '~/utils/error';

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
        getDisplayError(error, 'Failed to fetch chats. Please try again.')
      );
    }
  },

  async getChat(chatId: string): Promise<Chat> {
    try {
      const response = await api.get<Chat>(`/chats/${chatId}`);

      // Normalize the messages to match frontend expectations
      const chat = response.data;
      if (chat.messages) {
        chat.messages = chat.messages.map(message => ({
          ...message,
          // Convert backend roles to frontend roles
          role: message.role === 'human' ? 'user' : message.role === 'ai' ? 'model' : message.role,
          // Ensure date fields are Date objects
          createdAt: new Date(message.createdAt || message.created_at),
          updatedAt: new Date(message.updatedAt || message.updated_at),
          // Normalize snake_case to camelCase if needed
          chatId: message.chatId || message.chat_id
        }));
      }

      return chat;
    } catch (error: any) {
      console.error('Get chat error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      throw new Error(
        getDisplayError(error, 'Failed to fetch chat. Please try again.')
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
        getDisplayError(error, 'Failed to create chat. Please try again.')
      );
    }
  },

  async sendMessage(chatId: string, content: string): Promise<Message> {
    try {
      const response = await api.post<Message>(`/messages`, {chatId,content });
      return response.data;
    } catch (error: any) {
      console.error('Send message error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      throw new Error(
        getDisplayError(error, 'Failed to send message. Please try again.')
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
        getDisplayError(error, 'Failed to refresh data. Please try again.')
      );
    }
  }
}; 