import { View, Text } from 'react-native';
import { useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { authService } from '../../services/auth';
import { useAuth } from '../../contexts/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen = ({ navigation }: Props) => {
  const { login } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    try {
      setError('');
      setIsLoading(true);

      // Validate inputs
      if (!fullName || !email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      if (!email.includes('@')) {
        setError('Please enter a valid email address');
        return;
      }

      const response = await authService.signup({
        email,
        fullName,
        password,
      });

      // Navigate to login with pre-filled credentials
      navigation.navigate('Login', {
        email,
        password,
        fromRegister: true
      });
    } catch (err: any) {
      console.error('Signup screen error:', err);
      
      if (err.message === "400") {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.message === "429") {
        setError('Too many signup attempts. Please try again later.');
      } else if (!err.message) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background dark:bg-dark-background">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-md">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-primary dark:text-dark-primary mb-2">
              Create Account
            </Text>
            <Text className="text-secondary dark:text-dark-secondary">
              Join us to get started
            </Text>
          </View>

          {error ? (
            <View className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4">
              <Text className="text-red-500 dark:text-red-400 text-center">
                {error}
              </Text>
            </View>
          ) : null}

          <View className="space-y-4">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              autoCapitalize="words"
              value={fullName}
              onChangeText={setFullName}
            />
            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              showPasswordToggle
            />
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              showPasswordToggle
            />
            
            <Button 
              title="Sign Up" 
              onPress={handleSignup}
              loading={isLoading}
              disabled={isLoading}
            />
          </View>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-secondary dark:text-dark-secondary">
              Already have an account?{' '}
            </Text>
            <Text
              className="text-primary dark:text-dark-primary font-medium"
              onPress={() => navigation.navigate('Login')}
            >
              Sign In
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}; 