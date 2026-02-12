import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, AuthStackParamList, MainStackParamList } from '../types/navigation';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { DemoChatScreen } from '../screens/main/DemoChatScreen';
import { ChatScreen } from '../screens/main/ChatScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { EditProfileScreen } from '../screens/main/EditProfileScreen';
import { ChangePasswordScreen } from '../screens/main/ChangePasswordScreen';
import { SubscriptionScreen } from '../screens/main/SubscriptionScreen';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator, Platform, Linking, Alert } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import AppStateStore from 'Store/AppStateStore';
import InsightsLandingScreen from 'screens/main/InsightsLandingScreen';
import SettingsScreen from 'screens/main/SettingsScreen';
import FinancialOverviewScreen from 'screens/main/FinancialOverviewScreen';
import TabNavigation from './TabNavigation';
import { useEffect } from 'react';

const navigationRef = createNavigationContainerRef();

const MainStack = createNativeStackNavigator<MainStackParamList>();

// Create stack navigators
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
// const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator();

// Auth Stack Navigator
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="DemoChat" component={DemoChatScreen} />
    </AuthStack.Navigator>
  );
};

// Main Stack Navigator
// Main Stack Navigator
const MainNavigator = () => {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="Chat" component={ChatScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} /> {/* Changed from Profile */}
      <MainStack.Screen name="EditProfile" component={EditProfileScreen} />
      <MainStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <MainStack.Screen name="Subscription" component={SubscriptionScreen} />
    </MainStack.Navigator>
  );
};


// Root Navigator
export const Navigation = () => {
  const { isAuthenticated, isLoading, refreshUser } = useAuth();
  const { darkMode } = AppStateStore();

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      if (url === 'bankrai://payment/success') {
        try {
          await refreshUser();
          // Navigate back to the Settings root so the user isn't stuck on the Subscription screen
          if (navigationRef.isReady()) {
            navigationRef.navigate('Main' as never, {
              screen: 'Settings',
              params: { screen: 'SettingsMain' },
            } as never);
          }
          Alert.alert('Payment Successful', 'Your subscription has been activated!');
        } catch (error) {
          console.error('[DeepLink] Failed to refresh user after payment:', error);
        }
      } else if (url === 'bankrai://payment/cancel') {
        Alert.alert('Payment Canceled', 'Your payment was canceled. You can try again anytime.');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle the case where the app was opened from a deep link while closed
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => subscription.remove();
  }, [refreshUser]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background dark:bg-dark-background">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: darkMode ? '#141414' : '#f2f5f3',
        },
      }}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="Main" component={TabNavigation} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};
