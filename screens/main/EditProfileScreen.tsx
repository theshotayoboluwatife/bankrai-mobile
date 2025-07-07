import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types/navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

type Props = NativeStackScreenProps<MainStackParamList, 'EditProfile'>;

export const EditProfileScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('User Name');
  const [email, setEmail] = useState('user@example.com');

  const handleSave = () => {
    // TODO: Implement save profile logic
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
          Edit Profile
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
            <Text className="text-gray-600 dark:text-gray-400 mb-2">Name</Text>
            <TextInput
              className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-primary dark:text-dark-primary"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#666666"
            />
          </View>

          <View>
            <Text className="text-gray-600 dark:text-gray-400 mb-2">Email</Text>
            <TextInput
              className="bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-primary dark:text-dark-primary"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#666666"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}; 