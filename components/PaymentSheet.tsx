import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { stripeService } from '../services/stripe';
import { Ionicons } from '@expo/vector-icons';

interface PaymentSheetProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { user, refreshUser } = useAuth();

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      console.log('user', user);

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Create a checkout session
      const { url } = await stripeService.createCheckoutSession(
        process.env.EXPO_PUBLIC_STRIPE_PRICE_ID!
      );

      console.log('url', url);
      // Open the checkout URL in the device's browser
      
      // const supported = await Linking.canOpenURL(url);
      await Linking.openURL(url);
      // if (supported) {
      //   // Note: The success callback will be handled by the webhook
      //   // when the subscription is created
      // } else {
      //   throw new Error('Cannot open checkout URL');
      // }
    } catch (error) {
      console.error('Payment error:', error);
      onError?.(error instanceof Error ? error : new Error('Payment failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshUser();
      onSuccess?.();
    } catch (error) {
      console.error('Refresh error:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to refresh'));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <View className="p-4 gap-y-4">
      <TouchableOpacity
        className="bg-primary dark:bg-dark-primary rounded-lg p-4 items-center"
        onPress={handlePayment}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="black" />
        ) : (
          <Text className="text-white dark:text-black text-lg font-medium">
            Subscribe Now
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4 items-center flex-row justify-center space-x-2"
        onPress={handleRefresh}
        disabled={isRefreshing}
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
  );
}; 