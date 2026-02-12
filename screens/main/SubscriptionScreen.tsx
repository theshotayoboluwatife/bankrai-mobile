import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { adaptyService } from '../../services/adapty';
import { stripeService } from '../../services/stripe';
import Constants from 'expo-constants';
import Screen from 'components/Screen';
import AppText from 'components/AppText';
import AppStateStore from 'Store/AppStateStore';
import { getDisplayError } from '~/utils/error';

type Props = NativeStackScreenProps<MainStackParamList, 'Subscription'>;

export const SubscriptionScreen = ({ navigation }: Props) => {
  const { darkMode } = AppStateStore();
  const { user, refreshUser, isSubscribed, refreshSubscription } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const TERMS_URL =
    Constants.expoConfig?.extra?.termsUrl ||
    process.env.EXPO_PUBLIC_TERMS_URL ||
    'https://www.bankrai.app/terms-of-use';
  const PRIVACY_URL =
    Constants.expoConfig?.extra?.privacyUrl ||
    process.env.EXPO_PUBLIC_PRIVACY_URL ||
    'https://www.bankrai.app/privacy-policy';

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user?.has_paid_access, isSubscribed]);

  const checkSubscriptionStatus = useCallback(async () => {
    try {
      await refreshSubscription();
      setHasActiveSubscription(user?.has_paid_access || isSubscribed);
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      setHasActiveSubscription(false);
    }
  }, [user?.has_paid_access, isSubscribed, refreshSubscription]);

  const handleAdaptyPurchase = async () => {
    try {
      console.log('[Payment] Loading payment options...');
      const paywall = await adaptyService.getPaywall();
      if (!paywall) {
        throw new Error('Payment options are currently unavailable. Please try again later.');
      }

      console.log('[Payment] Preparing subscription plans...');
      const products = await adaptyService.getPaywallProducts(paywall);
      if (!products || products.length === 0) {
        throw new Error('No subscription plans available. Please try again later.');
      }

      const selectedProduct = products[0];

      console.log('[Payment] Processing payment...');
      const purchasedProfile = await adaptyService.purchaseProduct(selectedProduct);

      if (!purchasedProfile) {
        throw new Error('Purchase was not completed successfully');
      }

      console.log('[Payment] Purchase successful');
      setHasActiveSubscription(true);
      await refreshSubscription();
      await refreshUser();

      Alert.alert('Success', 'Your subscription has been activated!');
    } catch (error: any) {
      console.error('[Payment] Purchase error:', error);
      if (error.message?.includes('cancelled by user')) {
        return;
      }
      throw error;
    }
  };

  const handleStripePurchase = async () => {
    try {
      if (!process.env.EXPO_PUBLIC_STRIPE_PRICE_ID) {
        throw new Error('Payment configuration error. Please contact support.');
      }

      console.log('[Payment] Creating checkout session...');
      const { url } = await stripeService.createCheckoutSession(
        process.env.EXPO_PUBLIC_STRIPE_PRICE_ID
      );

      console.log('[Payment] Opening payment page...');
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error('Unable to open payment page');
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error('[Payment] Stripe checkout error:', error);
      throw error;
    }
  };

  const handleSubscribe = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to continue');
      return;
    }

    if (hasActiveSubscription) {
      Alert.alert('Already Subscribed', 'You already have an active subscription.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Payment] Initializing payment...');

      if (Platform.OS === 'ios') {
        await handleAdaptyPurchase();
      } else {
        await handleStripePurchase();
      }
    } catch (error) {
      console.error('[Payment] Payment failed:', error);
      Alert.alert(
        'Payment Failed',
        getDisplayError(error, 'Payment failed. Please try again.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'ios') return;

    try {
      setIsRestoringPurchases(true);
      console.log('[Payment] Restoring purchases...');
      await adaptyService.restorePurchases();

      console.log('[Payment] Updating account...');
      await refreshUser();
      await refreshSubscription();

      Alert.alert('Purchases Restored', 'Your previous purchases have been restored.');
    } catch (error) {
      console.error('[Payment] Restore failed:', error);
      Alert.alert(
        'Restore Failed',
        'No previous purchases found or restore failed. Please try again.'
      );
    } finally {
      setIsRestoringPurchases(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshUser();
      await checkSubscriptionStatus();
    } catch (error) {
      console.error('[Payment] Refresh failed:', error);
      Alert.alert('Error', 'Failed to refresh subscription status');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Screen
      className="flex-1 bg-background dark:bg-dark-background"
      style={{ paddingTop: insets.top }}>
      {/* Header */}
      <Screen className="flex-row items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700">
        <View className="flex-row items-center">
          <TouchableOpacity className="p-2" onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <AppText className="ml-4 font-bold text-xl text-primary dark:text-dark-primary">
            Subscription
          </AppText>
        </View>
        <TouchableOpacity onPress={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <Ionicons name="refresh" size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </Screen>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          {/* Subscription Status */}
          {hasActiveSubscription ? (
            <Screen className="mb-6 rounded-2xl border-2 border-green-300 bg-green-50 p-8 dark:border-green-700 dark:bg-green-900/20">
              <View className="mb-4 items-center">
                <Ionicons name="checkmark-circle" size={64} color="#10B981" />
              </View>
              <AppText
                darkModeColor="#4ade80"
                lightModeColor="#16a34a"
                className="mb-2 text-center font-bold text-3xl text-green-600 dark:text-green-400">
                Active Subscription
              </AppText>
              <AppText
                darkModeColor="#d1d5db"
                lightModeColor="#4b5563"
                className="text-center text-lg text-gray-600 dark:text-gray-300">
                You have full access to all premium features
              </AppText>
            </Screen>
          ) : (
            <>
              {/* Premium Header */}
              <View className="mb-8 mt-2 items-center">
                <AppText className="mb-3 text-center text-4xl font-extrabold text-primary dark:text-dark-primary">
                  BankrAI Premium
                </AppText>
                <AppText
                  darkModeColor="#d1d5db"
                  lightModeColor="#4b5563"
                  className="px-4 text-center text-lg text-gray-600 dark:text-gray-300">
                  Unlock unlimited AI-powered financial insights
                </AppText>
              </View>

              {/* Pricing Card */}
              <View className="mb-6 rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 dark:border-dark-primary/20 dark:from-dark-primary/5 dark:to-dark-primary/10">
                <View className="mb-6 items-center">
                  <AppText className="mb-2 text-5xl font-extrabold text-primary dark:text-dark-primary">
                    $9.99
                  </AppText>
                  <AppText
                    darkModeColor="#d1d5db"
                    lightModeColor="#4b5563"
                    className="text-xl font-semibold text-gray-600 dark:text-gray-300">
                    per month
                  </AppText>
                </View>

                {/* TODO: bg color */}
                <View
                  style={{
                    backgroundColor: darkMode ? ' rgb(0, 0, 0, 0.2)' : ' rgb(255, 255, 255, 0.5)',
                  }}
                  className="rounded-2xl bg-white/50 p-4 dark:bg-black/20">
                  <Text className="text-center text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {Platform.OS === 'ios'
                      ? 'Payment charged at confirmation. Cancel anytime in your App Store settings.'
                      : 'Payment charged at confirmation. Cancel anytime from your account settings.'}
                  </Text>
                </View>
              </View>

              {/* Subscribe Button */}
            <TouchableOpacity
              onPress={handleSubscribe}
              disabled={isLoading}
              style={{
                backgroundColor: '#007AFF',
                elevation: 8,
              }}
              className="mb-6 rounded-2xl p-6 shadow-lg">
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="large" />
              ) : (
                <AppText
                  style={{ color: '#ffffff' }}
                  className="text-center font-bold text-2xl">
                  Subscribe Now
                </AppText>
              )}
            </TouchableOpacity>
            </>
          )}

          {/* Restore Purchases Button (iOS only) */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={handleRestorePurchases}
              disabled={isRestoringPurchases}
              style={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                borderColor: darkMode ? '#4b5563' : '#d1d5db',
              }}
              className="mb-6 rounded-2xl border border-gray-300 bg-white p-5 dark:border-gray-600 dark:bg-gray-800">
              <View className="flex-row items-center justify-center">
                {isRestoringPurchases ? (
                  <ActivityIndicator color="#007AFF" />
                ) : (
                  <>
                    <Ionicons name="download-outline" size={24} color="#007AFF" />
                    <AppText className="ml-3 text-lg font-semibold text-primary dark:text-dark-primary">
                      Restore Purchases
                    </AppText>
                  </>
                )}
              </View>
            </TouchableOpacity>
          )}

          {/* Terms and Privacy Buttons */}
          <View className="mb-6 gap-y-3">
            <TouchableOpacity
              style={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                borderColor: darkMode ? '#374151' : '#e5e7eb',
              }}
              onPress={() => Linking.openURL(TERMS_URL)}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="document-text-outline" size={24} color="#666" />
                  <AppText
                    darkModeColor="#d1d5db"
                    lightModeColor="#374151"
                    className="ml-3 font-medium text-base text-gray-700 dark:text-gray-300">
                    Terms of Use
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                borderColor: darkMode ? '#374151' : '#e5e7eb',
              }}
              onPress={() => Linking.openURL(PRIVACY_URL)}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
                  <AppText
                    darkModeColor="#d1d5db"
                    lightModeColor="#374151"
                    className="ml-3 font-medium text-base text-gray-700 dark:text-gray-300">
                    Privacy Policy
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Fine Print */}
          <Screen className="rounded-xl bg-gray-50 p-4 dark:bg-gray-900">
            <AppText
              darkModeColor="#9ca3af"
              lightModeColor="#6b7280"
              className="text-center text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              Subscription renews automatically unless canceled at least 24 hours before the end of
              the current period.
              {Platform.OS === 'ios'
                ? ' Manage or cancel anytime in your App Store settings.'
                : ' Manage or cancel anytime from your account settings.'}
            </AppText>
          </Screen>
        </View>
      </ScrollView>
    </Screen>
  );
};
