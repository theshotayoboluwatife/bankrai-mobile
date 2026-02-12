import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { authService } from '../../services/auth';
import Constants from 'expo-constants';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

export const ProfileScreen = ({ navigation }: Props) => {
  const { logout, user, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDisconnectingPlaid, setIsDisconnectingPlaid] = useState(false);
  const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);
  const [error, setError] = useState('');

  const PRIVACY_URL = Constants.expoConfig?.extra?.privacyUrl || process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://www.bankrai.app/privacy-policy';
  const TERMS_URL = Constants.expoConfig?.extra?.termsUrl || process.env.EXPO_PUBLIC_TERMS_URL || 'https://www.bankrai.app/terms-of-use';

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
    if (!user?.plaidIntegration) return;

    Alert.alert(
      'Disconnect Plaid',
      'Are you sure you want to disconnect your bank account? This will remove all your financial data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unsubscribe',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelingSubscription(true);
              setError('');
              await authService.cancelSubscription();
              await refreshUser();
              Alert.alert('Success', 'Your subscription has been canceled successfully. You will lose access to premium features at the end of your billing period.');
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
        {
          text: 'Cancel',
          style: 'cancel',
        },
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
    <View
      className="flex-1 bg-background dark:bg-dark-background"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          className="p-2"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-primary dark:text-dark-primary ml-4">
          Profile
        </Text>
      </View>

      {/* Profile Content */}
      <ScrollView className="flex-1">
        {/* Profile Info */}
        <View className="p-6 items-center">
          <View className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mb-4">
            <Ionicons name="person" size={48} color="#666666" />
          </View>
          <Text className="text-2xl font-bold text-primary dark:text-dark-primary mb-1">
            {user?.fullName || 'User Name'}
          </Text>
          <Text className="text-gray-600 dark:text-gray-400">
            {user?.email || 'user@example.com'}
          </Text>
        </View>

        {error ? (
          <Text className="text-red-500 text-center mb-4 px-4">{error}</Text>
        ) : null}

        {/* Action Buttons */}
        <View className="px-4 gap-y-4">
          <TouchableOpacity
            className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="create-outline" size={24} color="#007AFF" className="mr-4" />
            <Text className="text-primary dark:text-dark-primary text-lg">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
            onPress={() => navigation.navigate('ChangePassword')}
          >
            <Ionicons name="key-outline" size={24} color="#007AFF" className="mr-4" />
            <Text className="text-primary dark:text-dark-primary text-lg">Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
            onPress={() => navigation.navigate('Subscription')}
          >
            <Ionicons name="card-outline" size={24} color="#007AFF" className="mr-4" />
            <Text className="text-primary dark:text-dark-primary text-lg">Subscription</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
            onPress={() => handleOpenUrl(PRIVACY_URL, 'Privacy Policy')}
          >
            <Ionicons name="shield-checkmark-outline" size={24} color="#007AFF" className="mr-4" />
            <Text className="text-primary dark:text-dark-primary text-lg">Privacy Policy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
            onPress={() => handleOpenUrl(TERMS_URL, 'Terms of Use')}
          >
            <Ionicons name="document-text-outline" size={24} color="#007AFF" className="mr-4" />
            <Text className="text-primary dark:text-dark-primary text-lg">Terms of Use</Text>
          </TouchableOpacity>

          {user?.plaidIntegration && (
            <TouchableOpacity
              className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
              onPress={handleDisconnectPlaid}
              disabled={isDisconnectingPlaid}
            >
              <Ionicons name="wallet-outline" size={24} color="#FF3B30" className="mr-4" />
              {isDisconnectingPlaid ? (
                <ActivityIndicator color="#FF3B30" />
              ) : (
                <Text className="text-[#FF3B30] text-lg">Disconnect Bank Account</Text>
              )}
            </TouchableOpacity>
          )}

          {user?.has_paid_access && Platform.OS !== 'ios' && (
            <TouchableOpacity
              className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
              onPress={handleCancelSubscription}
              disabled={isCancelingSubscription}
            >
              <Ionicons name="card-outline" size={24} color="#FF3B30" className="mr-4" />
              {isCancelingSubscription ? (
                <ActivityIndicator color="#FF3B30" />
              ) : (
                <Text className="text-[#FF3B30] text-lg">Cancel Subscription</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" className="mr-4" />
            {isLoggingOut ? (
              <ActivityIndicator color="#FF3B30" />
            ) : (
              <Text className="text-[#FF3B30] text-lg">Logout</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 bg-red-500 rounded-lg"
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={24} color="white" className="mr-3" />
            <Text className="text-white">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};