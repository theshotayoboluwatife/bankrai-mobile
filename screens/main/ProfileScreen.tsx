// import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { MainStackParamList } from '../../types/navigation';
// import { useAuth } from '../../contexts/AuthContext';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import { useState } from 'react';
// import { authService } from '../../services/auth';
//
// type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;
//
// export const ProfileScreen = ({ navigation }: Props) => {
//   const { logout, user, refreshUser } = useAuth();
//   const insets = useSafeAreaInsets();
//   const [isLoggingOut, setIsLoggingOut] = useState(false);
//   const [isDisconnectingPlaid, setIsDisconnectingPlaid] = useState(false);
//   const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);
//   const [error, setError] = useState('');
//
//   const handleLogout = async () => {
//     try {
//       setError('');
//       setIsLoggingOut(true);
//       await logout();
//     } catch (err) {
//       console.error('Logout error:', err);
//       setError('Failed to logout. Please try again.');
//     } finally {
//       setIsLoggingOut(false);
//     }
//   };
//
//   const handleDisconnectPlaid = async () => {
//     if (!user?.plaidIntegration) return;
//
//     Alert.alert(
//       'Disconnect Plaid',
//       'Are you sure you want to disconnect your bank account? This will remove all your financial data.',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Disconnect',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               setIsDisconnectingPlaid(true);
//               setError('');
//               await authService.disconnectPlaid();
//               // Refresh user data to update the UI
//               await refreshUser();
//               Alert.alert('Success', 'Your bank account has been disconnected successfully.');
//             } catch (error) {
//               console.error('Disconnect Plaid error:', error);
//               setError('Failed to disconnect bank account. Please try again.');
//             } finally {
//               setIsDisconnectingPlaid(false);
//             }
//           },
//         },
//       ],
//       { cancelable: true }
//     );
//   };
//
//   const handleCancelSubscription = async () => {
//     if (!user?.hasPaidAccess) return;
//
//     Alert.alert(
//       'Cancel Subscription',
//       'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Unsubscribe',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               setIsCancelingSubscription(true);
//               setError('');
//               await authService.cancelSubscription();
//               // Refresh user data to update the UI
//               await refreshUser();
//
//               Alert.alert('Success', 'Your subscription has been canceled successfully. You will lose access to premium features at the end of your billing period.');
//             } catch (error) {
//               console.error('Cancel subscription error:', error);
//               setError('Failed to cancel subscription. Please try again.');
//             } finally {
//               setIsCancelingSubscription(false);
//             }
//           },
//         },
//       ],
//       { cancelable: true }
//     );
//   };
//
//   const handleDeleteAccount = async () => {
//     if (!user?.id) return;
//
//     Alert.alert(
//       'Delete Account',
//       'Are you sure you want to delete your account? This action cannot be undone.',
//       [
//         {
//           text: 'Cancel',
//           style: 'cancel',
//         },
//         {
//           text: 'Delete',
//           style: 'destructive',
//           onPress: async () => {
//             try {
//               await authService.deleteUser(user.id);
//               await logout();
//             } catch (error) {
//               Alert.alert('Error', 'Failed to delete account. Please try again.');
//             }
//           },
//         },
//       ],
//       { cancelable: true }
//     );
//   };
//
//   return (
//     <View
//       className="flex-1 bg-background dark:bg-dark-background"
//       style={{ paddingTop: insets.top }}
//     >
//       {/* Header */}
//       <View className="px-4 py-4 flex-row items-center border-b border-gray-200 dark:border-gray-700">
//         <TouchableOpacity
//           className="p-2"
//           onPress={() => navigation.goBack()}
//         >
//           <Ionicons name="arrow-back" size={24} color="#007AFF" />
//         </TouchableOpacity>
//         <Text className="text-xl font-bold text-primary dark:text-dark-primary ml-4">
//           Profile
//         </Text>
//       </View>
//
//       {/* Profile Content */}
//       <ScrollView className="flex-1">
//         {/* Profile Info */}
//         <View className="p-6 items-center">
//           <View className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center mb-4">
//             <Ionicons name="person" size={48} color="#666666" />
//           </View>
//           <Text className="text-2xl font-bold text-primary dark:text-dark-primary mb-1">
//             {user?.fullName || 'User Name'}
//           </Text>
//           <Text className="text-gray-600 dark:text-gray-400">
//             {user?.email || 'user@example.com'}
//           </Text>
//         </View>
//
//         {error ? (
//           <Text className="text-red-500 text-center mb-4 px-4">{error}</Text>
//         ) : null}
//
//         {/* Action Buttons */}
//         <View className="px-4 gap-y-4">
//           <TouchableOpacity
//             className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
//             onPress={() => navigation.navigate('EditProfile')}
//           >
//             <Ionicons name="create-outline" size={24} color="#007AFF" className="mr-4" />
//             <Text className="text-primary dark:text-dark-primary text-lg">Edit Profile</Text>
//           </TouchableOpacity>
//
//           <TouchableOpacity
//             className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
//             onPress={() => navigation.navigate('ChangePassword')}
//           >
//             <Ionicons name="key-outline" size={24} color="#007AFF" className="mr-4" />
//             <Text className="text-primary dark:text-dark-primary text-lg">Change Password</Text>
//           </TouchableOpacity>
//
//           {user?.plaidIntegration && (
//             <TouchableOpacity
//               className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
//               onPress={handleDisconnectPlaid}
//               disabled={isDisconnectingPlaid}
//             >
//               <Ionicons name="wallet-outline" size={24} color="#FF3B30" className="mr-4" />
//               {isDisconnectingPlaid ? (
//                 <ActivityIndicator color="#FF3B30" />
//               ) : (
//                 <Text className="text-[#FF3B30] text-lg">Disconnect Bank Account</Text>
//               )}
//             </TouchableOpacity>
//           )}
//
//           {user?.hasPaidAccess && (
//             <TouchableOpacity
//               className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
//               onPress={handleCancelSubscription}
//               disabled={isCancelingSubscription}
//             >
//               <Ionicons name="card-outline" size={24} color="#FF3B30" className="mr-4" />
//               {isCancelingSubscription ? (
//                 <ActivityIndicator color="#FF3B30" />
//               ) : (
//                 <Text className="text-[#FF3B30] text-lg">Cancel Subscription</Text>
//               )}
//             </TouchableOpacity>
//           )}
//
//           <TouchableOpacity
//             className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
//             onPress={handleLogout}
//             disabled={isLoggingOut}
//           >
//             <Ionicons name="log-out-outline" size={24} color="#FF3B30" className="mr-4" />
//             {isLoggingOut ? (
//               <ActivityIndicator color="#FF3B30" />
//             ) : (
//               <Text className="text-[#FF3B30] text-lg">Logout</Text>
//             )}
//           </TouchableOpacity>
//
//           <TouchableOpacity
//             className="flex-row items-center p-4 bg-red-500 rounded-lg"
//             onPress={handleDeleteAccount}
//           >
//             <Ionicons name="trash-outline" size={24} color="white" className="mr-3" />
//             <Text className="text-white">Delete Account</Text>
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </View>
//   );
// };

import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { authService } from '../../services/auth';
import { adaptyService } from '../../services/adapty';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

export const ProfileScreen = ({ navigation }: Props) => {
  const { logout, user, refreshUser, refreshSubscription } = useAuth();
  const insets = useSafeAreaInsets();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDisconnectingPlaid, setIsDisconnectingPlaid] = useState(false);
  const [isCancelingSubscription, setIsCancelingSubscription] = useState(false);
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);
  const [error, setError] = useState('');

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
              // Refresh user data to update the UI
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
    if (!user?.hasPaidAccess) return;

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
              // Refresh user data to update the UI
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

  const handleRestorePurchases = async () => {
    if (Platform.OS !== 'ios') return;

    try {
      setIsRestoringPurchases(true);
      setError('');
      console.log('[Payment] Restoring purchases...');
      await adaptyService.restorePurchases();

      console.log('[Payment] Updating account...');
      await refreshUser();
      await refreshSubscription();

      Alert.alert(
        'Purchases Restored',
        'Your previous purchases have been restored.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('[Payment] Restore failed:', error);
      setError('Failed to restore purchases. Please try again.');
      Alert.alert(
        'Restore Failed',
        'No previous purchases found or restore failed. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsRestoringPurchases(false);
    }
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

          {Platform.OS === 'ios' && (
            <TouchableOpacity
              className="flex-row items-center p-4 bg-white dark:bg-dark-surface rounded-lg border border-gray-200 dark:border-gray-700"
              onPress={handleRestorePurchases}
              disabled={isRestoringPurchases}
            >
              <Ionicons name="download-outline" size={24} color="#007AFF" className="mr-4" />
              {isRestoringPurchases ? (
                <ActivityIndicator color="#007AFF" />
              ) : (
                <Text className="text-primary dark:text-dark-primary text-lg">Restore Purchases</Text>
              )}
            </TouchableOpacity>
          )}

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

          {user?.hasPaidAccess && (
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