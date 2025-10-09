import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Linking, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { stripeService } from '../services/stripe';
import { adaptyService } from '../services/adapty';
import { Ionicons } from '@expo/vector-icons';

interface PaymentSheetProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  onSuccess,
  onError,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const { user, refreshUser, isSubscribed, refreshSubscription } = useAuth();

  // Check subscription status on mount
  useEffect(() => {
    checkSubscriptionStatus();
  }, []);


  const checkSubscriptionStatus = useCallback(async () => {
    try {
      setIsCheckingSubscription(true);

      await refreshSubscription();

     setHasActiveSubscription(user?.hasPaidAccess || isSubscribed);

    } catch (error) {
      console.error('Failed to check subscription status:', error);
      setHasActiveSubscription(false);
    } finally {
      setIsCheckingSubscription(false);
    }
  }, [user?.hasPaidAccess, isSubscribed, refreshSubscription]);

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

  if (isCheckingSubscription) {
    return (
      <View className="p-4 items-center">
        <ActivityIndicator size="large" color="gray" />
        <Text className="text-gray-600 dark:text-gray-300 mt-2">
          Checking subscription status...
        </Text>
      </View>
    );
  }

 return (
   <View className="p-4 gap-y-4">
     <View className="gap-y-2">
       <TouchableOpacity
         className="bg-primary dark:bg-dark-primary rounded-lg p-4 items-center justify-center"
         onPress={handlePayment}
         disabled={isLoading}
       >
         {isLoading ? (
           <ActivityIndicator size="small" color="blue" />
         ) : (
           <Text className="text-white dark:text-black text-lg font-medium">
             {Platform.OS === 'ios'
               ? 'Subscribe with App Store'
               : 'Subscribe with Stripe'}
           </Text>
         )}
       </TouchableOpacity>
     </View>

     <View className="gap-y-2">
       <TouchableOpacity
         className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 items-center flex-row justify-center space-x-2"
         onPress={handleRefresh}
         disabled={isRefreshing || isLoading}
       >
         {isRefreshing ? (
           <ActivityIndicator size="small" color="gray" />
         ) : (
           <>
             <Ionicons name="refresh" size={20} color="gray" />
             <Text className="text-gray-600 dark:text-gray-300 text-base">
               Refresh Status
             </Text>
           </>
         )}
       </TouchableOpacity>
     </View>
   </View>
 );

};