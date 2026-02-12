import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  ActivityIndicator,
  useColorScheme,
  RefreshControl,
  KeyboardAvoidingView,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createLinkToken, exchangePublicToken } from '~/utils/plaid';
import {
  LinkSuccess,
  LinkExit,
  LinkLogLevel,
  create,
  open,
  LinkIOSPresentationStyle,
} from 'react-native-plaid-link-sdk';
import { chatService, Chat, Message } from '../../services/chat';
import Markdown from 'react-native-markdown-display';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { PaymentSheet } from '../../components/PaymentSheet';
import { Paywall } from '../../components/PayWall';
import { authService } from '../../services/auth';
import { adaptyService } from '../../services/adapty';
import Screen from 'components/Screen';
import AppText from 'components/AppText';
import AppStateStore from 'Store/AppStateStore';
import { getDisplayError } from '~/utils/error';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

export const ChatScreen = ({ navigation }: Props) => {
  const { logout, user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-300)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const [isPlaidConnected, setIsPlaidConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaidReady, setIsPlaidReady] = useState(false);
  const [isPlaidConnecting, setIsPlaidConnecting] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isFetchingChats, setIsFetchingChats] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const notificationAnim = useRef(new Animated.Value(0)).current;
  const stripe = useStripe();
  const [error, setError] = useState('');
  const [showSubscriptionOverlay, setShowSubscriptionOverlay] = useState(false);
  const { darkMode, setDarkMode, setUseDeviceColorScheme } = AppStateStore();

  // Ref for scrolling to bottom when new messages arrive
  const scrollViewRef = useRef<ScrollView>(null);

  const markdownStyles = {
    body: {
      color: darkMode ? '#F3F4F6' : '#1F2937',
      fontSize: 16,
    },
    code_inline: {
      backgroundColor: darkMode ? '#374151' : '#F3F4F6',
      color: darkMode ? '#F3F4F6' : '#1F2937',
      padding: 4,
      borderRadius: 4,
    },
    code_block: {
      backgroundColor: darkMode ? '#374151' : '#F3F4F6',
      color: darkMode ? '#F3F4F6' : '#1F2937',
      padding: 8,
      borderRadius: 4,
      marginVertical: 8,
    },
    link: {
      color: '#007AFF',
    },
    list_item: {
      marginVertical: 4,
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      marginVertical: 8,
      color: darkMode ? '#F3F4F6' : '#1F2937',
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 8,
      color: darkMode ? '#F3F4F6' : '#1F2937',
    },
    heading3: {
      fontSize: 18,
      fontWeight: 'bold',
      marginVertical: 8,
      color: darkMode ? '#F3F4F6' : '#1F2937',
    },
    blockquote: {
      backgroundColor: darkMode ? '#374151' : '#F3F4F6',
      borderLeftColor: '#007AFF',
      borderLeftWidth: 4,
      padding: 8,
      marginVertical: 8,
    },
  };

  useEffect(() => {
    if (user?.plaid_integration) {
      setIsPlaidConnected(true);
    } else {
      setIsPlaidConnected(false);
      setLinkToken(null);
      setIsPlaidReady(false);
    }
  }, [user?.plaid_integration]);

  useEffect(() => {
    // Automatically fetch link token if not connected and token doesn't exist
    if (!isPlaidConnected && !linkToken && user?.id) {
      fetchLinkToken();
    }
  }, [user, isPlaidConnected, linkToken]);

  useEffect(() => {
    // Fetch chats when Plaid is connected
    if (isPlaidConnected) {
      fetchChats();
    }
  }, [isPlaidConnected]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(sidebarAnim, {
        toValue: isSidebarOpen ? 0 : -300,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayAnim, {
        toValue: isSidebarOpen ? 0.5 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSidebarOpen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (selectedChat?.messages && selectedChat.messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [selectedChat?.messages]);

  const handlePurchase = async () => {
    try {
      console.log('[Paywall] Getting Adapty paywall...');
      const paywall = await adaptyService.getPaywall();

      if (!paywall) throw new Error('Failed to load paywall');

      const products = await adaptyService.getPaywallProducts(paywall);
      if (!products.length) throw new Error('No products found');

      const product = products[0]; // or pick a specific one if multiple
      console.log('[Paywall] Initiating purchase for product:', product.vendorProductId);

      const profile = await adaptyService.purchaseProduct(product);

      console.log('[Paywall] Purchase completed:', profile);
      await refreshUser();
      return profile;
    } catch (error) {
      console.error('[Paywall] Purchase error:', error);
      throw error;
    }
  };

  const fetchChats = async () => {
    try {
      setIsFetchingChats(true);
      console.log('fetching chats-----');
      const fetchedChats = await chatService.getChats();
      // Sort chats by createdAt in descending order (newest first)
      const sortedChats = fetchedChats.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setChats(sortedChats);

      if (sortedChats.length === 0) {
        // Create a new chat if none exist
        const newChat = await chatService.createChat();
        setChats([newChat]);
        setSelectedChat(newChat);
      } else {
        // Check if the latest chat is empty
        const latestChat = sortedChats[0]; // Now using the first chat since it's sorted
        const isLatestChatEmpty = !latestChat.messages || latestChat.messages.length === 0;

        if (isLatestChatEmpty) {
          // Open the latest empty chat
          setSelectedChat(latestChat);
        } else {
          // Create and open a new chat
          const newChat = await chatService.createChat();
          setChats((prev) => [newChat, ...prev]); // Add new chat at the beginning
          setSelectedChat(newChat);
        }
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsFetchingChats(false);
    }
  };

const handleChatSelect = async (chatId: string) => {
  try {
    const chat = await chatService.getChat(chatId);

    // 🔍 Debug: Log the entire chat response
    console.log('📥 Full chat response:', JSON.stringify(chat, null, 2));

    // 🔍 Debug: Log each message's role specifically
    if (chat?.messages) {
      chat.messages.forEach((msg: any, index: number) => {
        console.log(`Message ${index}:`, {
          id: msg.id,
          role: msg.role,
          content: msg.content?.substring(0, 50)
        });
      });
    }

    if (chat) {
      setSelectedChat(chat);
      setIsSidebarOpen(false);
    }
  } catch (error) {
    console.error('Error fetching chat:', error);
  }
};

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    console.log("user:", user);

    // Check if user has reached message limit before sending
    if (!user?.has_paid_access && user.message_count >= 2) {
      setShowSubscriptionOverlay(true);
          setNewMessage('');
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    try {
      setIsSendingMessage(true);
      setError('');

      // Create a temporary ID for the user message
      const tempUserMessageId = `user-${Date.now()}`;
      const tempLoadingMessageId = `loading-${Date.now()}`;

      // Add user message to UI immediately
      const userMessage: Message = {
        id: tempUserMessageId,
        content: messageContent,
        role: 'user',
        chatId: selectedChat.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add loading message for AI response
      const loadingMessage: Message = {
        id: tempLoadingMessageId,
        content: '...',
        role: 'model',
        chatId: selectedChat.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update selected chat with both messages
      setSelectedChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...(prev.messages || []), userMessage, loadingMessage]
        };
      });

      // Update chats list with both messages
      setChats(prev => prev.map(chat =>
        chat.id === selectedChat.id
          ? { ...chat, messages: [...(chat.messages || []), userMessage, loadingMessage] }
          : chat
      ));

      // Send message to backend
      const backendResponse = await chatService.sendMessage(selectedChat.id, messageContent);

      console.log('📨 Raw backend response:', JSON.stringify(backendResponse, null, 2));

      if (backendResponse) {
        // Transform the backend response into a proper Message object
        // Handle both {response: "..."} and {content: "..."} formats
        const response: Message = {
          id: backendResponse.id || `ai-${Date.now()}`,
          content: backendResponse.response || backendResponse.content || '',
          role: backendResponse.role || 'model',
          chatId: selectedChat.id,
          createdAt: backendResponse.createdAt ? new Date(backendResponse.createdAt) : new Date(),
          updatedAt: backendResponse.updatedAt ? new Date(backendResponse.updatedAt) : new Date()
        };

        console.log('✅ Transformed message:', JSON.stringify(response, null, 2));

        // Replace loading message with actual response
        setSelectedChat(prev => {
          if (!prev) return null;
          const updatedMessages = [
            ...(prev.messages?.filter(msg => !msg.id?.startsWith('loading-')) || []),
            response
          ];

          console.log('📝 Updated messages count:', updatedMessages.length);
          console.log('📝 Last message content:', updatedMessages[updatedMessages.length - 1]?.content?.substring(0, 100));

          return {
            ...prev,
            messages: updatedMessages
          };
        });

        // Update chats list with actual response
        setChats(prev => prev.map(chat =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                messages: [
                  ...(chat.messages?.filter(msg => !msg.id?.startsWith('loading-')) || []),
                  response
                ]
              }
            : chat
        ));

        // Refresh user data to get updated message count
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Send message error:', error);

      // Remove loading message on error but keep user message
      setSelectedChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages?.filter(msg => !msg.id?.startsWith('loading-')) || []
        };
      });

      setChats(prev => prev.map(chat =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              messages: (chat.messages || []).filter(msg => !msg.id?.startsWith('loading-'))
            }
          : chat
      ));

      if (error.response?.status === 403 && error.response?.data?.error?.includes('free message limit')) {
        setShowSubscriptionOverlay(true);
      } else {
        setError(getDisplayError(error, 'Failed to send message. Please try again.'));
      }
    } finally {
      setIsSendingMessage(false);
    }
  };

  const fetchLinkToken = async () => {
    try {
      if (!user?.id) {
        console.error('No user ID found');
        await logout();
        return;
      }

      setIsLoading(true);
      setIsPlaidReady(false);
      const token = await createLinkToken(user.id);
      console.log('Received link token:', token);
      setLinkToken(token);

      // Create Plaid instance with minimal config
      create({
        token: token,
        logLevel: LinkLogLevel.ERROR,
        noLoadingState: false,
      });
      console.log('Plaid instance created');
      setIsPlaidReady(true);
    } catch (error: any) {
      console.error('Error creating link token:', error);
      if (error.message === 'Authentication required. Please log in again.') {
        await logout();
        return;
      }
      // Optionally show an error message to the user
      const errorChat: Chat = {
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Error',
        userId: user?.id || '',
        isArchived: false,
        messages: [
          {
            id: Date.now().toString(),
            content: 'Sorry, there was an error preparing the connection. Please try reloading.',
            role: 'model',
            chatId: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
      setChats((prev) => [...prev, errorChat]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccess = async (success: LinkSuccess) => {
    try {
      if (!user?.id) {
        console.error('No user ID found');
        await logout();
        return;
      }

      console.log('Plaid success:', success);
      setIsPlaidConnecting(true);

      // Exchange the public token
      await exchangePublicToken(
        success.publicToken,
        user.id,
        success.metadata.institution?.id || ''
      );

      // Fetch Plaid data and wait for it to complete
      try {
        await authService.fetchPlaidData();
        console.log('Initial Plaid data fetch completed');
      } catch (error) {
        console.error('Error fetching initial Plaid data:', error);
        // Retry once after a short delay
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await authService.fetchPlaidData();
        console.log('Retry Plaid data fetch completed');
      }

      setIsPlaidConnected(true);
      setIsPlaidConnecting(false);
      const successChat: Chat = {
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Connected',
        userId: user.id,
        isArchived: false,
        messages: [
          {
            id: Date.now().toString(),
            content:
              'Successfully connected your bank account! How can I help you with your finances?',
            role: 'model',
            chatId: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
      setChats((prev) => [...prev, successChat]);
      await refreshUser();
      console.log('User refreshed successfully:', user);
    } catch (error: any) {
      console.error('Error exchanging public token:', error);
      if (error.message === 'Authentication required. Please log in again.') {
        await logout();
        return;
      }
      const errorChat: Chat = {
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
        title: 'Error',
        userId: user?.id || '',
        isArchived: false,
        messages: [
          {
            id: Date.now().toString(),
            content: 'Sorry, there was an error connecting your bank account. Please try again.',
            role: 'model',
            chatId: Date.now().toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };
      setChats((prev) => [...prev, errorChat]);
    } finally {
      setIsPlaidConnecting(false);
    }
  };

  const handleExit = (exit: LinkExit) => {
    console.log('Plaid link exited:', exit);
    setLinkToken(null);
    setIsPlaidConnecting(false);
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    Animated.sequence([
      Animated.timing(notificationAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(notificationAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setNotification(null));
  };

  const onRefresh = async () => {
    console.log('Refreshing user data');
    if (isRefreshing) return; // Prevent multiple refreshes
    try {
      setIsRefreshing(true);
      const updatedUser = await refreshUser();
      console.log('User refreshed successfully:', updatedUser);
      showNotification('User data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing user data:', error);
      if (error instanceof Error) {
        if (error.message.includes('authentication')) {
          showNotification('Session expired. Please login again.', 'error');
          // You might want to navigate to login screen here
        } else {
          showNotification(getDisplayError(error, 'Failed to refresh user data'), 'error');
        }
      } else {
        showNotification('Failed to refresh user data', 'error');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <StripeProvider
      publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}
      urlScheme="bankrai">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <Screen style={{ flex: 1 }}>
          {showSubscriptionOverlay && (
            <View className="absolute inset-0 z-50 items-center justify-center bg-black/80 p-6">
              <View className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-dark-surface">
                <View className="mb-6 items-center">
                  <AppText className="mb-2 text-center font-bold text-2xl text-primary dark:text-dark-primary">
                    Upgrade to Premium
                  </AppText>
                  <Text className="text-center text-gray-600 dark:text-gray-400">
                    You've reached your free message limit. Upgrade to Premium for unlimited
                    AI-powered financial insights.
                  </Text>
                </View>

             <TouchableOpacity
               className="mb-3 rounded-xl p-4"
               style={{
                 backgroundColor: '#000000',
               }}
               onPress={() => {
                 setShowSubscriptionOverlay(false);
                 navigation.navigate('Settings', {
                       screen: 'Subscription'
                     });
               }}>
               <AppText
                 className="text-center font-bold text-lg text-white"
                 style={{ color: '#FFFFFF' }}
               >
                 View Subscription Plans
               </AppText>
             </TouchableOpacity>

               <TouchableOpacity
                 className="mb-3 rounded-xl p-4"
                 style={{
                   backgroundColor: '#f2f5f3',
                 }}
                 onPress={() => setShowSubscriptionOverlay(false)}>
                 <AppText
                   className="text-center text-base font-semibold"
                   style={{ color: '#374151' }}
                 >
                   Maybe Later
                 </AppText>
               </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center justify-center p-3"
                  onPress={logout}>
                  <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
                  <Text className="ml-2 text-base text-[#FF3B30]">Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View
            className="flex-row items-center justify-between border-b border-gray-200 px-4 dark:border-gray-700"
            style={{ paddingTop: insets.top }}>
            <TouchableOpacity className="p-2" onPress={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Ionicons
                name={isSidebarOpen ? 'close' : 'menu'}
                size={24}
                color={!darkMode ? '#141414' : '#f2f5f3'}
              />
            </TouchableOpacity>
            <AppText className="font-bold text-xl text-primary dark:text-dark-primary">
              BankrAI
            </AppText>
            <TouchableOpacity
              onPress={() => {
                setDarkMode(!darkMode);
                setUseDeviceColorScheme(false);
              }}>
              <MaterialIcons
                color={!darkMode ? '#141414' : '#f2f5f3'}
                name={!darkMode ? 'dark-mode' : 'light-mode'}
                size={20}
              />
            </TouchableOpacity>
          </View>

          <Animated.View
            className="absolute left-0 top-0 z-20 h-full w-72 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-dark-surface"
            style={{
              transform: [{ translateX: sidebarAnim }],
              backgroundColor: darkMode ? '#202020' : '#f2f5f3',
            }}>
            <View className="h-full flex-1 flex-col" style={{ paddingTop: insets.top }}>
              <View className="flex-row items-center justify-between border-gray-200 p-4 dark:border-gray-700">
                <View>
                  <AppText className="font-bold text-2xl text-primary dark:text-dark-primary">
                    Chats
                  </AppText>
                  <Text className={`text-lg ${darkMode ? 'text-gray-300' : '600'} `}>
                    Your conversation history
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                  <Ionicons color={!darkMode ? '#141414' : '#f2f5f3'} name="close" size={24} />
                </TouchableOpacity>
              </View>

              <View className="gap-y-2 border-gray-200 p-4 dark:border-gray-700">
                <TouchableOpacity
                  style={{
                    marginBottom: 30,
                    backgroundColor: darkMode ? '#202020' : '#00003d',
                  }}
                  className="flex-row items-center justify-start rounded-md border border-gray-200 p-3 dark:border-gray-700"
                  onPress={async () => {
                    try {
                      const newChat = await chatService.createChat();
                      setChats((prev) => [...prev, newChat]);
                      setSelectedChat(newChat);
                      setIsSidebarOpen(false);
                    } catch (error) {
                      console.error('Error creating chat:', error);
                    }
                  }}
                  disabled={!isPlaidConnected}>
                  <Ionicons
                    color={darkMode ? 'white' : '#f2f5f3'}
                    name="add"
                    size={20}
                    className="mr-2"
                  />
                  <AppText
                    style={{
                      color: darkMode ? 'white' : '#f2f5f3',
                    }}
                    className={`${isPlaidConnected ? 'text-primary dark:text-dark-primary' : 'text-gray-400 dark:text-gray-600'}`}>
                    New Chat
                  </AppText>
                </TouchableOpacity>

                {/* <TouchableOpacity
                  className="flex-row items-center justify-start rounded-md border border-gray-200 p-3 dark:border-gray-700"
                  onPress={onRefresh}
                  disabled={!isPlaidConnected || isRefreshing}>
                  {isRefreshing ? (
                    <ActivityIndicator size="small" color="#007AFF" className="mr-2" />
                  ) : (
                    <Ionicons
                      name="refresh-outline"
                      size={20}
                      color={isPlaidConnected ? '#007AFF' : '#999999'}
                      className="mr-2"
                    />
                  )}
                  <Text
                    className={`${isPlaidConnected ? 'text-primary dark:text-dark-primary' : 'text-gray-400 dark:text-gray-600'}`}>
                    Refresh Your Data
                  </Text>
                </TouchableOpacity> */}
              </View>
              <AppText
                style={{
                  color: darkMode ? '#707070' : 'gray',
                }}
                className="px-4 font-bold text-xl">
                Recent
              </AppText>
              <ScrollView className="flex-1">
                {isFetchingChats ? (
                  <View className="items-center justify-center p-4">
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
                ) : chats.length > 0 ? (
                  chats.map((chat) => (
                    <View key={chat.id} className="relative">
                      <TouchableOpacity
                        style={{
                          backgroundColor: darkMode ? '#202020' : '#f2f5f3',
                        }}
                        className={`border-b border-gray-100 px-4 py-3 dark:border-gray-800 ${
                          selectedChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                        }`}
                        onPress={() => handleChatSelect(chat.id)}>
                        <View className="flex-row items-center justify-between">
                          <AppText className="flex-1 font-medium text-primary dark:text-dark-primary">
                            {chat.title || 'Untitled Chat'}
                          </AppText>

                          {/* Delete Button */}
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              Alert.alert(
                                'Delete Chat',
                                'Are you sure you want to delete this chat?',
                                [
                                  {
                                    text: 'Cancel',
                                    style: 'cancel'
                                  },
                                  {
                                    text: 'Delete',
                                    style: 'destructive',
                                    onPress: async () => {
                                      try {
                                        await chatService.deleteChat(chat.id);
                                        setChats(prev => prev.filter(c => c.id !== chat.id));
                                        if (selectedChat?.id === chat.id) {
                                          setSelectedChat(null);
                                        }
                                        showNotification('Chat deleted successfully', 'success');
                                      } catch (error) {
                                        console.error('Error deleting chat:', error);
                                        showNotification('Failed to delete chat', 'error');
                                      }
                                    }
                                  }
                                ]
                              );
                            }}
                            className="ml-3 p-2">
                            <Ionicons
                              name="trash-outline"
                              size={20}
                              color={darkMode ? '#EF4444' : '#DC2626'}
                            />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <AppText
                    style={{
                      marginTop: 50,
                      color: darkMode ? '#cccccc' : '#202020',
                    }}
                    className="text-center">
                    no recent chats
                  </AppText>
                )}
              </ScrollView>

              {/* <View className="border-t border-gray-200 p-4 dark:border-gray-700">
                <TouchableOpacity
                  style={{
                    backgroundColor: darkMode ? '#404040' : '#cccccc',
                    padding: 10,
                    borderRadius: 10,
                  }}
                  className="flex-row items-center"
                  onPress={() => {
                    setIsSidebarOpen(false);
                    navigation.navigate('Profile');
                  }}>
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                    <Ionicons name="person" size={20} color="#666666" />
                  </View>
                  <View>
                    <AppText className="font-medium text-primary dark:text-dark-primary">
                      {user?.fullName || 'User Name'}
                    </AppText>
                    <AppText className="text-sm text-secondary dark:text-dark-secondary">
                      Settings
                    </AppText>
                  </View>
                </TouchableOpacity>
              </View> */}
            </View>
          </Animated.View>

          {isSidebarOpen && (
            <TouchableOpacity
              className="absolute bottom-0 left-0 right-0 top-0 z-10 bg-black/75"
              style={{
                opacity: overlayAnim,
              }}
              onPress={() => setIsSidebarOpen(false)}
              activeOpacity={1}
            />
          )}

          {notification && (
            <Animated.View
              className={`absolute left-0 right-0 top-0 z-30 p-4 ${
                notification.type === 'success'
                  ? 'bg-green-500 dark:bg-green-600'
                  : 'bg-red-500 dark:bg-red-600'
              }`}
              style={{
                opacity: notificationAnim,
                transform: [
                  {
                    translateY: notificationAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, 0],
                    }),
                  },
                ],
              }}>
              <Text className="text-center text-white">{notification.message}</Text>
            </Animated.View>
          )}

          {!isPlaidConnected ? (
            <View className="flex-1 items-center justify-center p-6">
              <View className="w-full max-w-md">
                <View className="mb-8 items-center">
                  <View
                    style={{
                      backgroundColor: darkMode ? '#505050' : '#cccccc',
                    }}
                    className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary dark:bg-dark-primary">
                    <Ionicons name="wallet" size={32} color="white dark:text-black" />
                  </View>
                  <AppText className="mb-2 text-center font-bold text-2xl text-primary dark:text-dark-primary">
                    Connect Your Bank Account
                  </AppText>
                  <Text className="text-center text-gray-600 dark:text-gray-400">
                    Connect your bank account through Plaid to get started with financial insights
                    and assistance.
                  </Text>
                </View>
                <View className="items-center">
                  {isLoading ? (
                    <ActivityIndicator size="large" color="#007AFF" />
                  ) : linkToken ? (
                    <TouchableOpacity
                      className={`flex-row items-center justify-center rounded-lg bg-primary p-4 dark:bg-dark-primary ${
                        !isPlaidReady || isPlaidConnecting ? 'opacity-50' : ''
                      }`}
                      onPress={() => {
                        if (isPlaidReady) {
                          console.log('Opening Plaid Link...');
                          setIsPlaidConnecting(true);
                          open({
                            iOSPresentationStyle: LinkIOSPresentationStyle.MODAL,
                            onSuccess: handleSuccess,
                            onExit: handleExit,
                          });
                        }
                      }}
                      disabled={!isPlaidReady || isLoading || isPlaidConnecting}>
                      <Text className="font-medium text-lg text-white dark:text-black">
                        {isLoading
                          ? 'Loading...'
                          : isPlaidReady
                            ? isPlaidConnecting
                              ? 'Connecting...'
                              : 'Connect Bank Account'
                            : 'Initializing...'}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text className="mt-4 text-center text-red-500">
                      Could not retrieve Plaid token. Please check your connection or try again
                      later.
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ) : (
            <>
              <View className="flex-1">
                <ScrollView
                  ref={scrollViewRef}
                  className="flex-1 p-4"
                  contentContainerStyle={{ paddingBottom: 20 }}
                  refreshControl={
                    <RefreshControl
                      refreshing={isRefreshing}
                      onRefresh={onRefresh}
                      tintColor={darkMode ? '#FFFFFF' : '#007AFF'}
                      colors={['#007AFF']}
                      progressBackgroundColor={darkMode ? '#1F2937' : '#FFFFFF'}
                    />
                  }
                  showsVerticalScrollIndicator={false}>
                  {selectedChat && selectedChat.messages && selectedChat.messages.length > 0 ? (
                    selectedChat.messages.map((message) => (
                      <View
                        key={message.id}
                        className={`mb-4 ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <View
                          className={`rounded-lg p-3 ${message.role === 'user' ? 'max-w-[80%]' : 'w-[90%]'}`}
                          style={{
                            backgroundColor: message.role === 'user'
                              ? (darkMode ? '#00001d' : '#00003d')  // Blue shades
                              : (darkMode ? '#232329' : '#ffffff')  // Gray shades
                          }}>
                          {message.role === 'user' ? (
                            <Text className="text-white">{message.content || ''}</Text>
                          ) : message.id?.startsWith('loading-') ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                          ) : (
                            <Markdown style={markdownStyles}>{message.content || ''}</Markdown>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="mt-20 flex-1 items-center justify-center">
                      <AppText className="mb-4 font-bold text-4xl text-primary dark:text-dark-primary">
                        Bankr AI
                      </AppText>
                      <Text className="px-8 text-center text-lg text-gray-600 dark:text-gray-400">
                        Your personal financial assistant. Ask a question to get started.
                      </Text>
                    </View>
                  )}
                </ScrollView>

                <View
                  className="border-t border-gray-200"
                  // style={{ paddingBottom: insets.bottom }}
                >
                  <View
                    style={{
                      backgroundColor: darkMode ? '#141414' : '#F3F4F6',
                      // flexDirection: 'row',
                      alignItems: 'flex-end',
                    }}
                    className="flex-row items-end p-4">
                    <View className="mr-2 flex-1 justify-center ">
                      <TextInput
                        className="rounded-xl border border-gray-200 bg-white
                        text-base leading-5 text-primary dark:border-gray-700
                        dark:bg-dark-surface dark:text-dark-primary"
                        placeholder="Type your message..."
                        placeholderTextColor="#666666"
                        value={newMessage}
                        onChangeText={setNewMessage}
                        multiline
                        maxLength={1000}
                        style={{
                          minHeight: 44,
                          maxHeight: 120,
                          paddingVertical: 10,
                          paddingHorizontal: 10,
                          textAlignVertical: 'top',
                          backgroundColor: darkMode ? '#141414' : '#F3F4F6',
                          color: !darkMode ? '#141414' : '#F3F4F6',
                        }}
                        editable={!isSendingMessage}
                        returnKeyType="send"
                        onSubmitEditing={() => {
                          if (newMessage.trim() && !isSendingMessage) {
                            handleSendMessage();
                          }
                        }}
                        blurOnSubmit={false}
                      />
                    </View>
                    <TouchableOpacity
                      className={`items-center justify-center rounded-xl ${
                        isSendingMessage || !newMessage.trim()
                          ? 'bg-gray-300 dark:bg-gray-600'
                          : 'bg-primary dark:bg-dark-primary'
                      }`}
                      style={{
                        backgroundColor: darkMode ? '#2e2d2d' : '#141414',
                        // paddingVertical: 14,
                        paddingHorizontal: 15,
                        height: 44,
                      }}
                      onPress={handleSendMessage}
                      disabled={isSendingMessage || !newMessage.trim()}>
                      {isSendingMessage ? (
                        <ActivityIndicator size="small" color={darkMode ? 'black' : 'white'} />
                      ) : (
                        <MaterialIcons
                          name="send"
                          size={20}
                          color={!newMessage.trim() ? '#999' :  'white'}
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          )}
        </Screen>
      </KeyboardAvoidingView>
    </StripeProvider>
  );
};
