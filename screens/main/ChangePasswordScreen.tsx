import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

type Props = NativeStackScreenProps<MainStackParamList, 'ChangePassword'>;

export const ChangePasswordScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSave = () => {
    // TODO: Implement change password logic
    navigation.goBack();
  };

  return (
    <View 
      className="flex-1 bg-background dark:bg-dark-background"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-4 py-4 flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700">
        <TouchableOpacity
          className="p-2"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-primary dark:text-dark-primary">
          Change Password
        </Text>
        <TouchableOpacity
          className="p-2"
          onPress={handleSave}
        >
          <Text className="text-primary dark:text-dark-primary font-medium">Save</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView className="flex-1 p-4">
        <View className="space-y-4">
          <View>
            <Text className="text-gray-600 dark:text-gray-400 mb-2">Current Password</Text>
            <TextInput
              className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-primary dark:text-dark-primary"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor="#666666"
              secureTextEntry
            />
          </View>

          <View>
            <Text className="text-gray-600 dark:text-gray-400 mb-2">New Password</Text>
            <TextInput
              className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-primary dark:text-dark-primary"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor="#666666"
              secureTextEntry
            />
          </View>

          <View>
            <Text className="text-gray-600 dark:text-gray-400 mb-2">Confirm New Password</Text>
            <TextInput
              className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-primary dark:text-dark-primary"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor="#666666"
              secureTextEntry
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}; 