import { View, Text, TouchableOpacity, ScrollView, TextInput, Animated, ActivityIndicator, useColorScheme, RefreshControl, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { createLinkToken, exchangePublicToken } from "~/utils/plaid";
import { LinkSuccess, LinkExit, LinkLogLevel, create, open, LinkIOSPresentationStyle } from 'react-native-plaid-link-sdk';
import { chatService, Chat, Message } from '../../services/chat';
import Markdown from 'react-native-markdown-display';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { PaymentSheet } from '../../components/PaymentSheet';
import { authService } from '../../services/auth';

type Props = NativeStackScreenProps<MainStackParamList, 'Chat'>;

export const ChatScreen = ({ navigation }: Props) => {
  const { logout, user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
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
  const [darkMode, setDarkMode] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const notificationAnim = useRef(new Animated.Value(0)).current;
  const stripe = useStripe();
  const [error, setError] = useState('');
  const [showSubscriptionOverlay, setShowSubscriptionOverlay] = useState(false);

  // Ref for scrolling to bottom when new messages arrive
  const scrollViewRef = useRef<ScrollView>(null);

  const markdownStyles = {
    body: {
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
      fontSize: 16,
    },
    code_inline: {
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
      padding: 4,
      borderRadius: 4,
    },
    code_block: {
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
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
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      marginVertical: 8,
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
    },
    heading3: {
      fontSize: 18,
      fontWeight: 'bold',
      marginVertical: 8,
      color: isDarkMode ? '#F3F4F6' : '#1F2937',
    },
    blockquote: {
      backgroundColor: isDarkMode ? '#374151' : '#F3F4F6',
      borderLeftColor: '#007AFF',
      borderLeftWidth: 4,
      padding: 8,
      marginVertical: 8,
    },
  };

  useEffect(() => {
    if (user?.plaidIntegration) {
      setIsPlaidConnected(true);
    } else {
      setIsPlaidConnected(false);
      setLinkToken(null);
      setIsPlaidReady(false);
    }
  }, [user?.plaidIntegration]);

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
      })
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

  const fetchChats = async () => {
    try {
      setIsFetchingChats(true);
      const fetchedChats = await chatService.getChats();
      // Sort chats by createdAt in descending order (newest first)
      const sortedChats = fetchedChats.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
          setChats(prev => [newChat, ...prev]); // Add new chat at the beginning
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
    console.log("user:", user)

    // Check if user has reached message limit before sending
    if (!user?.hasPaidAccess && user?.messageCount! >= 2) {
      setShowSubscriptionOverlay(true);
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately

    try {
      setIsSendingMessage(true);
      setError('');

      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        content: messageContent,
        role: 'user',
        chatId: selectedChat.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add loading message for AI response
      const loadingMessage: Message = {
        id: 'loading-' + Date.now().toString(),
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
      const response = await chatService.sendMessage(selectedChat.id, messageContent);

      if (response) {
        // Replace loading message with actual response
        setSelectedChat(prev => {
          if (!prev) return null;
          const messages = prev.messages?.filter(msg => !msg.id.startsWith('loading-')) || [];
          return {
            ...prev,
            messages: [...messages, response]
          };
        });

        // Update chats list with actual response
        setChats(prev => prev.map(chat =>
          chat.id === selectedChat.id
            ? {
                ...chat,
                messages: (chat.messages || []).filter(msg => !msg.id.startsWith('loading-')).concat(response)
              }
            : chat
        ));

        // Refresh user data to get updated message count
        await refreshUser();
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      // Remove loading message on error
      setSelectedChat(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages?.filter(msg => !msg.id.startsWith('loading-')) || []
        };
      });
      setChats(prev => prev.map(chat =>
        chat.id === selectedChat.id
          ? {
              ...chat,
              messages: (chat.messages || []).filter(msg => !msg.id.startsWith('loading-'))
            }
          : chat
      ));

      if (error.response?.status === 403 && error.response?.data?.error?.includes('free message limit')) {
        setShowSubscriptionOverlay(true);
      } else {
        setError(error.response?.data?.error || 'Failed to send message. Please try again.');
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
        messages: [{
          id: Date.now().toString(),
          content: 'Sorry, there was an error preparing the connection. Please try reloading.',
          role: 'model',
          chatId: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };
      setChats(prev => [...prev, errorChat]);
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
      await exchangePublicToken(success.publicToken, user.id, success.metadata.institution?.id || '');

      // Fetch Plaid data and wait for it to complete
      try {
        await authService.fetchPlaidData();
        console.log('Initial Plaid data fetch completed');
      } catch (error) {
        console.error('Error fetching initial Plaid data:', error);
        // Retry once after a short delay
        await new Promise(resolve => setTimeout(resolve, 2000));
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
        messages: [{
          id: Date.now().toString(),
          content: 'Successfully connected your bank account! How can I help you with your finances?',
          role: 'model',
          chatId: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };
      setChats(prev => [...prev, successChat]);
      await refreshUser();
      console.log("User refreshed successfully:", user)
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
        messages: [{
          id: Date.now().toString(),
          content: 'Sorry, there was an error connecting your bank account. Please try again.',
          role: 'model',
          chatId: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      };
      setChats(prev => [...prev, errorChat]);
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
    console.log("Refreshing user data")
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
          showNotification(error.message || 'Failed to refresh user data', 'error');
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
      urlScheme="bankrai"
    >
      <KeyboardAvoidingView
        className="flex-1 bg-background dark:bg-dark-background"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {showSubscriptionOverlay && (
          <View className="absolute inset-0 bg-black/80 z-50 items-center justify-center p-6">
            <View className="bg-white dark:bg-dark-surface rounded-lg p-6 w-full max-w-md">
              <View className="items-center mb-6">
                <View className="w-16 h-16 rounded-full bg-red-500 items-center justify-center mb-4">
                  <Ionicons name="lock-closed" size={32} color="white" />
                </View>
                <Text className="text-2xl font-bold text-primary dark:text-dark-primary mb-2 text-center">
                  Subscription Required
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-center">
                  You've reached your free message limit. Please subscribe to continue using BankrAI.
                </Text>
              </View>
              <PaymentSheet
                onSuccess={async () => {
                  showNotification('Payment successful! Welcome to BankrAI.', 'success');
                  try {
                    await refreshUser();
                    setShowSubscriptionOverlay(false);
                  } catch (error) {
                    console.error('Error refreshing user data:', error);
                    showNotification('Payment successful, but failed to refresh user data.', 'error');
                  }
                }}
                onError={(error) => {
                  showNotification(error.message, 'error');
                }}
              />
              <TouchableOpacity
                className="mt-2 flex-row items-center justify-center p-4"
                onPress={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Logout error:', error);
                    showNotification('Failed to logout. Please try again.', 'error');
                  }
                }}
              >
                <Ionicons name="log-out-outline" size={20} color="#FF3B30" className="mr-2" />
                <Text className="text-[#FF3B30] text-md">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View
          className="px-4 flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700"
          style={{ paddingTop: insets.top }}
        >
          <TouchableOpacity
            className="p-2"
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Ionicons
              name={isSidebarOpen ? "close" : "menu"}
              size={24}
              color="#007AFF"
            />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-primary dark:text-dark-primary">
            Bankr AI
          </Text>
          <View className="w-10" />
        </View>

        <Animated.View
          className="absolute top-0 left-0 h-full w-72 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-gray-700 z-20"
          style={{
            transform: [{ translateX: sidebarAnim }],
          }}
        >
          <View className="flex-1 flex-col h-full" style={{ paddingTop: insets.top }}>
            <View className="p-4 border-b border-gray-200 dark:border-gray-700 flex-row items-center justify-between">
              <Text className="text-primary dark:text-dark-primary text-lg font-bold">Chats</Text>
              <TouchableOpacity onPress={() => setIsSidebarOpen(false)}>
                <Ionicons name="close" size={24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            <View className="p-4 border-b border-gray-200 dark:border-gray-700 gap-y-2">
              <TouchableOpacity
                className="border border-gray-200 dark:border-gray-700 rounded-md p-3 flex-row items-center justify-start"
                onPress={async () => {
                  try {
                    const newChat = await chatService.createChat();
                    setChats(prev => [...prev, newChat]);
                    setSelectedChat(newChat);
                    setIsSidebarOpen(false);
                  } catch (error) {
                    console.error('Error creating chat:', error);
                  }
                }}
                disabled={!isPlaidConnected}
              >
                <Ionicons name="add-circle-outline" size={20} color={isPlaidConnected ? "#007AFF" : "#999999"} className="mr-2" />
                <Text className={`${isPlaidConnected ? "text-primary dark:text-dark-primary" : "text-gray-400 dark:text-gray-600"}`}>New Chat</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="border border-gray-200 dark:border-gray-700 rounded-md p-3 flex-row items-center justify-start"
                onPress={onRefresh}
                disabled={!isPlaidConnected || isRefreshing}
              >
                {isRefreshing ? (
                  <ActivityIndicator size="small" color="#007AFF" className="mr-2" />
                ) : (
                  <Ionicons name="refresh-outline" size={20} color={isPlaidConnected ? "#007AFF" : "#999999"} className="mr-2" />
                )}
                <Text className={`${isPlaidConnected ? "text-primary dark:text-dark-primary" : "text-gray-400 dark:text-gray-600"}`}>Refresh Your Data</Text>
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1">
              {isFetchingChats ? (
                <View className="items-center justify-center p-4">
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : (
                chats.map((chat) => (
                  <TouchableOpacity
                    key={chat.id}
                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-800 ${
                      selectedChat?.id === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                    }`}
                    onPress={() => handleChatSelect(chat.id)}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-primary dark:text-dark-primary font-medium">
                        {chat.title || 'Untitled Chat'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            <View className="border-t border-gray-200 dark:border-gray-700 p-4">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => {
                  setIsSidebarOpen(false);
                  navigation.navigate('Profile');
                }}
              >
                <View className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3 items-center justify-center">
                  <Ionicons name="person" size={20} color="#666666" />
                </View>
                <View>
                  <Text className="text-primary dark:text-dark-primary font-medium">
                    {user?.fullName || 'User Name'}
                  </Text>
                  <Text className="text-secondary dark:text-dark-secondary text-sm">
                    Settings
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {isSidebarOpen && (
          <TouchableOpacity
            className="absolute top-0 left-0 right-0 bottom-0 bg-black/75 z-10"
            style={{
              opacity: overlayAnim,
            }}
            onPress={() => setIsSidebarOpen(false)}
            activeOpacity={1}
          />
        )}

        {notification && (
          <Animated.View
            className={`absolute top-0 left-0 right-0 z-30 p-4 ${
              notification.type === 'success'
                ? 'bg-green-500 dark:bg-green-600'
                : 'bg-red-500 dark:bg-red-600'
            }`}
            style={{
              opacity: notificationAnim,
              transform: [{
                translateY: notificationAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-100, 0],
                }),
              }],
            }}
          >
            <Text className="text-white text-center">
              {notification.message}
            </Text>
          </Animated.View>
        )}

        {!isPlaidConnected ? (
          <View className="flex-1 items-center justify-center p-6">
            <View className="w-full max-w-md">
              <View className="items-center mb-8">
                <View className="w-16 h-16 rounded-full bg-primary dark:bg-dark-primary items-center justify-center mb-4">
                  <Ionicons name="wallet" size={32} color="white dark:text-black" />
                </View>
                <Text className="text-2xl font-bold text-primary dark:text-dark-primary mb-2 text-center">
                  Connect Your Bank Account
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 text-center">
                  Connect your bank account through Plaid to get started with financial insights and assistance.
                </Text>
              </View>
              <View className="items-center">
                {isLoading ? (
                  <ActivityIndicator size="large" color="#007AFF" />
                ) : linkToken ? (
                  <TouchableOpacity
                    className={`bg-primary dark:bg-dark-primary rounded-lg p-4 flex-row items-center justify-center ${
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
                    disabled={!isPlaidReady || isLoading || isPlaidConnecting}
                  >
                    <Text className="text-white dark:text-black text-lg font-medium">
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
                  <Text className="text-red-500 text-center mt-4">
                    Could not retrieve Plaid token. Please check your connection or try again later.
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
                    tintColor={isDarkMode ? "#FFFFFF" : "#007AFF"}
                    colors={["#007AFF"]}
                    progressBackgroundColor={isDarkMode ? "#1F2937" : "#FFFFFF"}
                  />
                }
                showsVerticalScrollIndicator={false}
              >
                {selectedChat && selectedChat.messages && selectedChat.messages.length > 0 ? (
                  selectedChat.messages.map((message) => (
                    <View
                      key={message.id}
                      className={`mb-4 ${
                        message.role === 'user' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <View
                        className={`rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'max-w-[80%] bg-primary dark:bg-dark-primary'
                            : 'w-[90%] bg-gray-100 dark:bg-gray-800'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <Text className="text-white dark:text-black">
                            {message.content}
                          </Text>
                        ) : message.id.startsWith('loading-') ? (
                          <ActivityIndicator size="small" color="#007AFF" />
                        ) : (
                          <Markdown
                            style={markdownStyles}
                          >
                            {message.content}
                          </Markdown>
                        )}
                      </View>
                    </View>
                  ))
                ) : (
                  <View className="flex-1 items-center justify-center mt-20">
                    <Text className="text-4xl font-bold text-primary dark:text-dark-primary mb-4">
                      Bankr AI
                    </Text>
                    <Text className="text-lg text-gray-600 dark:text-gray-400 text-center px-8">
                      Your personal financial assistant. Ask a question to get started.
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View
                className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-background"
                style={{ paddingBottom: insets.bottom }}
              >
                <View className="p-4 flex-row items-end">
                  <View className="flex-1 mr-2">
                    <TextInput
                      className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3
                        text-primary dark:text-dark-primary bg-white dark:bg-dark-surface
                        text-base leading-5"
                      placeholder="Type your message..."
                      placeholderTextColor="#666666"
                      value={newMessage}
                      onChangeText={setNewMessage}
                      multiline
                      maxLength={1000}
                      style={{
                        minHeight: 44,
                        maxHeight: 120,
                        textAlignVertical: 'top',
                        paddingTop: 12,
                        paddingBottom: 12
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
                    className={`w-11 h-11 rounded-xl items-center justify-center ${
                      isSendingMessage || !newMessage.trim()
                        ? 'bg-gray-300 dark:bg-gray-600'
                        : 'bg-primary dark:bg-dark-primary'
                    }`}
                    onPress={handleSendMessage}
                    disabled={isSendingMessage || !newMessage.trim()}
                  >
                    {isSendingMessage ? (
                      <ActivityIndicator size="small" color={isDarkMode ? "black" : "white"} />
                    ) : (
                      <MaterialIcons
                        name="send"
                        size={20}
                        color={!newMessage.trim() ? "#999" : (isDarkMode ? "black" : "white")}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </StripeProvider>
  );
};