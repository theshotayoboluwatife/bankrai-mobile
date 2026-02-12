import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { authService } from '../../services/auth';
import Constants from 'expo-constants';
import AppStateStore from 'Store/AppStateStore';
import Screen from 'components/Screen';
import AppText from 'components/AppText';
import App from 'App';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'>;

export const SettingsScreen = ({ navigation }: Props) => {
  const { logout, user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDisconnectingPlaid, setIsDisconnectingPlaid] = useState(false);
  const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);
  const [error, setError] = useState('');
  const { darkMode } = AppStateStore();

  const PRIVACY_URL =
    Constants.expoConfig?.extra?.privacyUrl ||
    process.env.EXPO_PUBLIC_PRIVACY_URL ||
    'https://www.bankrai.app/privacy-policy';
  const TERMS_URL =
    Constants.expoConfig?.extra?.termsUrl ||
    process.env.EXPO_PUBLIC_TERMS_URL ||
    'https://www.bankrai.app/terms-of-use';

  const handleOpenUrl = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open ${title}`);
      }
    } catch (error) {
      console.error(`Error opening ${title}:`, error);
      Alert.alert('Error', `Failed to open ${title}`);
    }
  };

  const handleLogout = async () => {
    try {
      setError('');
      setIsLoggingOut(true);
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleDisconnectPlaid = async () => {
    if (!user?.plaid_integration) return;

    Alert.alert(
      'Disconnect Plaid',
      'Are you sure you want to disconnect your bank account? This will remove all your financial data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDisconnectingPlaid(true);
              setError('');
              await authService.disconnectPlaid();
              await refreshUser();
              Alert.alert('Success', 'Your bank account has been disconnected successfully.');
            } catch (error) {
              console.error('Disconnect Plaid error:', error);
              setError('Failed to disconnect bank account. Please try again.');
            } finally {
              setIsDisconnectingPlaid(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCancelSubscription = async () => {
    if (!user?.has_paid_access) return;

    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelingSubscription(true);
              setError('');
              await authService.cancelSubscription();
              await refreshUser();
              Alert.alert(
                'Success',
                'Your subscription has been canceled successfully. You will lose access to premium features at the end of your billing period.'
              );
            } catch (error) {
              console.error('Cancel subscription error:', error);
              setError('Failed to cancel subscription. Please try again.');
            } finally {
              setIsCancelingSubscription(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteUser(user.id);
              await logout();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <Screen
      className="flex-1 bg-background dark:bg-dark-background"
      style={{ paddingTop: 2 }}>
      {/* Header */}


      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {error ? (
          <View className="mx-4 mt-4 rounded-lg bg-red-100 p-4 dark:bg-red-900/30">
            <AppText className="text-red-600 dark:text-red-400">{error}</AppText>
          </View>
        ) : null}

 <Screen
        style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
        className=" px-4 py-4 dark:border-gray-700">
        <AppText className="mb-2 font-bold text-3xl text-primary dark:text-dark-primary">
          Settings
        </AppText>
        <AppText className="text-lg text-gray-600 dark:text-gray-300">
          Manage your preferences and account settings
        </AppText>
      </Screen>

        {/* Profile Section */}
        <Screen
          style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
          className="mx-4 mt-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-dark-surface">
          <View className="mb-6">
            <AppText className="mb-1 font-bold text-2xl text-primary dark:text-dark-primary">
              Profile
            </AppText>
            <AppText className="text-base text-gray-600 dark:text-gray-400">
              Manage your personal information
            </AppText>
          </View>

          {/* Profile Info */}
          <View className="mb-6 items-center">
            <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
              <Ionicons name="person" size={40} color="#666666" />
            </View>
            <AppText className="mb-1 font-bold text-xl text-primary dark:text-dark-primary">
              {user ? `${user.first_name} ${user.last_name}`.trim() : 'User Name'}
            </AppText>
            <AppText
              darkModeColor="#9ca3af"
              lightModeColor="#4b5563"
              className="text-gray-600 dark:text-gray-400">
              {user?.email || 'user@example.com'}
            </AppText>
          </View>

          {/* Profile Actions */}
          <View className="gap-y-3">
            <TouchableOpacity
              className="flex-row items-center rounded-lg border border-gray-200 p-3 opacity-50 dark:border-gray-600"
              disabled={true}>
              <Ionicons name="create-outline" size={20} color="#999999" />
              <AppText
                darkModeColor="#9ca3af"
                lightModeColor="#9ca3af"
                className="ml-3 text-gray-400 dark:text-gray-500">
                Edit Profile
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center rounded-lg border border-gray-200 p-3 opacity-50 dark:border-gray-600"
              disabled={true}>
              <Ionicons name="key-outline" size={20} color="#999999" />
              <AppText
                darkModeColor="#9ca3af"
                lightModeColor="#9ca3af"
                className="ml-3 text-gray-400 dark:text-gray-500">
                Change Password
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center rounded-lg border border-gray-200 p-3 opacity-50 dark:border-gray-600"
              disabled={true}>
              <Ionicons name="download-outline" size={20} color="#999999" />
              <AppText
                darkModeColor="#9ca3af"
                lightModeColor="#9ca3af"
                className="ml-3 text-gray-400 dark:text-gray-500">
                Export Data
              </AppText>
            </TouchableOpacity>
          </View>
        </Screen>

        {/* Budget Settings Section */}
        <Screen
          style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
          className="mx-4 mt-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-dark-surface">
          <View className="mb-6">
            <AppText className="mb-1 font-bold text-2xl text-primary dark:text-dark-primary">
              Budget Settings
            </AppText>
            <AppText
              darkModeColor="#4b5563"
              lightModeColor="#4b5563"
              className="text-base text-gray-600 dark:text-gray-400">
              Configure your monthly budget
            </AppText>
          </View>

          <AppText className="mb-2 font-bold text-lg text-primary dark:text-dark-primary">
            Monthly Budget
          </AppText>
          <View
            style={{ marginBottom: 16 }}
            className="flex-row items-center rounded-lg border border-gray-300 px-4 py-3">
            <Text style={{ marginRight: 8 }} className="text-lg text-gray-500">
              $
            </Text>
            <TextInput
              className="h-full flex-1 text-lg"
              placeholderTextColor="#6b7280"
              style={{
                color: darkMode ? 'white' : 'black',
                marginBottom: Platform.OS === 'android' ? 0 : 5,
              }}
              keyboardType="numeric"
              placeholder="3500.00"
              editable={false}
            />
          </View>
          <TouchableOpacity
            className="w-full rounded-lg bg-gray-400 py-3 opacity-50 dark:bg-gray-600"
            disabled={true}>
            <AppText className="text-center text-lg text-gray-300">Save Budget Settings</AppText>
          </TouchableOpacity>
        </Screen>

        {/* Subscription Section */}
        <Screen
          style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
          className="mx-4 mt-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-dark-surface">
          <View className="mb-6">
            <AppText className="mb-1 font-bold text-2xl text-primary dark:text-dark-primary">
              Subscription
            </AppText>
            <AppText
              darkModeColor="#9ca3af"
              lightModeColor="#4b5563"
              className="text-base text-gray-600 dark:text-gray-400">
              Manage your subscription
            </AppText>
          </View>

          <TouchableOpacity
            className="flex-row items-center rounded-lg border border-gray-200 p-3 dark:border-gray-600"
            onPress={() => navigation.navigate('Subscription')}>
            <Ionicons name="card-outline" size={20} color="#007AFF" />
            <AppText className="ml-3 text-primary dark:text-dark-primary">
              View Subscription Details
            </AppText>
          </TouchableOpacity>
        </Screen>

        {/* Legal Section */}
        <Screen
          style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
          className="mx-4 mt-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-dark-surface">
          <View className="mb-6">
            <AppText className="mb-1 font-bold text-2xl text-primary dark:text-dark-primary">
              Legal
            </AppText>
            <AppText
              darkModeColor="#9ca3af"
              lightModeColor="#4b5563"
              className="text-base text-gray-600 dark:text-gray-400">
              Review our policies
            </AppText>
          </View>

          <View className="gap-y-3">
            <TouchableOpacity
              className="flex-row items-center rounded-lg border border-gray-200 p-3 dark:border-gray-600"
              onPress={() => handleOpenUrl(PRIVACY_URL, 'Privacy Policy')}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#007AFF" />
              <AppText className="ml-3 text-primary dark:text-dark-primary">Privacy Policy</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center rounded-lg border border-gray-200 p-3 dark:border-gray-600"
              onPress={() => handleOpenUrl(TERMS_URL, 'Terms of Use')}>
              <Ionicons name="document-text-outline" size={20} color="#007AFF" />
              <AppText className="ml-3 text-primary dark:text-dark-primary">Terms of Use</AppText>
            </TouchableOpacity>
          </View>
        </Screen>

        {/* Danger Zone */}
        <Screen
          style={{ borderColor: darkMode ? '#374151' : '#e5e7eb' }}
          className="mx-4 mb-8 mt-4 rounded-2xl border-2 border-red-500 bg-white p-6 dark:bg-dark-surface">
          <View className="mb-6">
            <View className="mb-1 flex-row items-center">
              <MaterialIcons name="warning" size={24} color="#e83a1c" />
              <Text className="ml-2 font-bold text-2xl" style={{ color: '#e83a1c' }}>
                Danger Zone
              </Text>
            </View>
            <AppText
              darkModeColor="#9ca3af"
              lightModeColor="#4b5563"
              className="text-base text-gray-600 dark:text-gray-400">
              Irreversible and destructive actions
            </AppText>
          </View>

          <View className="gap-y-4">
            {/* Unsubscribe */}
            {user?.has_paid_access && Platform.OS !== 'ios' && (
              <View className="border-b border-gray-200 pb-4 dark:border-gray-700">
                <View className="flex-row items-center justify-between">
                  <View className="mr-3 flex-1">
                    <AppText className="mb-1 font-bold text-lg text-primary dark:text-dark-primary">
                      Unsubscribe from Premium
                    </AppText>
                    <AppText className="text-sm text-gray-600 dark:text-gray-400">
                      Cancel your premium subscription
                    </AppText>
                  </View>
                  <TouchableOpacity
                    className="rounded-lg bg-red-600 px-4 py-2"
                    onPress={handleCancelSubscription}
                    disabled={isCancelingSubscription}>
                    {isCancelingSubscription ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <AppText className="text-sm font-semibold text-white">Unsubscribe</AppText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Logout */}
            <View className="border-b border-gray-200 pb-4 dark:border-gray-700">
              <View className="flex-row items-center justify-between">
                <View className="mr-3 flex-1">
                  <AppText className="mb-1 font-bold text-lg text-primary dark:text-dark-primary">
                    Logout
                  </AppText>
                  <AppText
                    darkModeColor="#9ca3af"
                    lightModeColor="#4b5563"
                    className="text-base text-gray-600 dark:text-gray-400">
                    Sign out of your account
                  </AppText>
                </View>
                <TouchableOpacity
                  className="rounded-lg bg-red-600 px-4 py-2"
                  onPress={handleLogout}
                  disabled={isLoggingOut}>
                  {isLoggingOut ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-sm font-semibold text-white">Logout</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Disconnect Plaid */}
            {user?.plaid_integration && (
              <View className="border-b border-gray-200 pb-4 dark:border-gray-700">
                <View className="flex-row items-center justify-between">
                  <View className="mr-3 flex-1">
                    <AppText className="mb-1 font-bold text-lg text-primary dark:text-dark-primary">
                      Disconnect Plaid
                    </AppText>
                    <AppText
                      darkModeColor="#9ca3af"
                      lightModeColor="#4b5563"
                      className="text-base text-gray-600 dark:text-gray-400">
                      Remove bank account connections
                    </AppText>
                  </View>
                  <TouchableOpacity
                    className="rounded-lg bg-red-600 px-4 py-2"
                    onPress={handleDisconnectPlaid}
                    disabled={isDisconnectingPlaid}>
                    {isDisconnectingPlaid ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="text-sm font-semibold text-white">Disconnect</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Delete Account */}
            <View>
              <View className="flex-row items-center justify-between">
                <View className="mr-3 flex-1">
                  <AppText className="mb-1 font-bold text-lg text-primary dark:text-dark-primary">
                    Delete Account
                  </AppText>
                  <AppText
                    darkModeColor="#9ca3af"
                    lightModeColor="#4b5563"
                    className="text-base text-gray-600 dark:text-gray-400">
                    Permanently delete your account and all data
                  </AppText>
                </View>
                <TouchableOpacity
                  className="rounded-lg bg-red-600 px-4 py-2"
                  onPress={handleDeleteAccount}>
                  <Text className="text-sm font-semibold text-white">Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Screen>
      </ScrollView>
    </Screen>
  );
};
