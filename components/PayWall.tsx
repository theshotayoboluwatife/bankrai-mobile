import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Linking, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { adaptyService } from '../services/adapty';
import { stripeService } from '../services/stripe';





interface PaywallProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
  onClose?: () => void;
  handlePurchase?: () => Promise<void>;
}

export const Paywall: React.FC<PaywallProps> = ({
  onSuccess,
  onError,
  onCancel,
  onClose,
  handlePurchase,
}) => {
  const [isLoading, setIsLoading] = useState(false);
   const [isRefreshing, setIsRefreshing] = useState(false);
   const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
   const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
      const { user, refreshUser, isSubscribed, refreshSubscription } = useAuth();


  const TERMS_URL = process.env.EXPO_PUBLIC_TERMS_URL || 'https://yourapp.com/terms';
  const PRIVACY_URL = process.env.EXPO_PUBLIC_PRIVACY_URL || 'https://yourapp.com/privacy';




    // Check subscription status on mount
    useEffect(() => {
      checkSubscriptionStatus();
    }, []);


    const checkSubscriptionStatus = useCallback(async () => {
      try {
        setIsCheckingSubscription(true);

        await refreshSubscription();

       setHasActiveSubscription(user?.has_paid_access || isSubscribed);

      } catch (error) {
        console.error('Failed to check subscription status:', error);
        setHasActiveSubscription(false);
      } finally {
        setIsCheckingSubscription(false);
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

        console.log('[Payment] Adapty purchase successful:', purchasedProfile?.accessLevels);

        console.log('[Payment] Updating account...');
        setHasActiveSubscription(true);
        await refreshSubscription();
        onSuccess?.();
      } catch (error: any) {
        console.error('[Payment] Adapty purchase error:', error);


        if (error.message?.includes('cancelled by user')) {
          onCancel?.();
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

    const handlePayment = async () => {
      if (!user?.id) {
        onError?.(new Error('Please log in to continue'));
        return;
      }

      if (hasActiveSubscription) {
        Alert.alert(
          'Already Subscribed',
          'You already have an active subscription.',
          [{ text: 'OK' }]
        );
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
     onSuccess?.();
      } catch (error) {
        console.error('[Payment] Payment failed:', error);
        onError?.(error instanceof Error ? error : new Error('Payment failed'));
      } finally {
        setIsLoading(false);

      }
    };

    const handleRefresh = async () => {
      try {
        setIsRefreshing(true);
        await refreshUser();
        await checkSubscriptionStatus();

      } catch (error) {
        console.error('[Payment] Refresh failed:', error);
        onError?.(error instanceof Error ? error : new Error('Failed to refresh subscription status'));
      } finally {
        setIsRefreshing(false);
      }
    };




  return (
    <View className="relative bg-white dark:bg-black rounded-3xl p-8 shadow-lg">
      {onClose && (
        <TouchableOpacity onPress={onClose} className="absolute top-5 right-5">
          <Ionicons name="close" size={30} color="#666" />
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-3xl font-extrabold text-center mb-3">BankrAI Premium</Text>
        <Text className="text-lg text-gray-700 dark:text-gray-300 text-center mb-6 leading-relaxed">

        </Text>

        <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-5 mb-6">
          <Text className="text-xl font-bold text-center mb-1 text-gray-900 dark:text-gray-100">
            Premium Plan
          </Text>
          <Text className="text-lg text-center text-gray-700 dark:text-gray-300 mb-1">
            $9.99 / month
          </Text>
          <Text className="text-sm text-center text-gray-500 dark:text-gray-400">
            Payment charged at confirmation. Cancel anytime in your App Store settings.
          </Text>
        </View>

        <TouchableOpacity
          onPress={handlePayment}
          disabled={isLoading}
          className="bg-primary dark:bg-dark-primary rounded-2xl p-5 mb-6"
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text className="text-white dark:text-black text-xl font-bold text-center">
              Subscribe Now
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mb-5">
          <TouchableOpacity onPress={() => Linking.openURL(TERMS_URL)}>
            <Text className="text-primary dark:text-dark-primary text-sm mr-3 underline">
              Terms of Use
            </Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm">•</Text>
          <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text className="text-primary dark:text-dark-primary text-sm ml-3 underline">
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 leading-relaxed">
          Subscription renews automatically unless canceled at least 24 hours before the
          end of the current period. Manage or cancel anytime in your App Store settings.
        </Text>
      </ScrollView>
    </View>
  );
};
