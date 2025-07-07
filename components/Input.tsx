import { TextInput, TextInputProps, View, Text, useColorScheme, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export const Input = ({ label, error, showPasswordToggle, secureTextEntry, ...props }: InputProps) => {
  const colorScheme = useColorScheme();
  const placeholderColor = colorScheme === 'dark' ? '#666666' : '#999999';
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="mb-4">
      {label && (
        <Text className="text-secondary dark:text-dark-secondary text-sm mb-1">
          {label}
        </Text>
      )}
      <View className="relative">
        <TextInput
          className={`border border-gray-300 dark:border-gray-700 rounded-md px-4 py-3 
            text-primary dark:text-dark-primary bg-white dark:bg-dark-surface
            ${error ? 'border-error dark:border-dark-error' : ''}
            ${showPasswordToggle ? 'pr-12' : ''}`}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry && !showPassword}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            className="absolute right-3 top-2"
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color={colorScheme === 'dark' ? '#CCCCCC' : '#666666'}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text className="text-error dark:text-dark-error text-sm mt-1">
          {error}
        </Text>
      )}
    </View>
  );
}; 