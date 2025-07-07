import { View, Text, Image, Modal, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types/navigation';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/auth';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation, route }: Props) => {
  const { login } = useAuth();
  const [email, setEmail] = useState(route.params?.email || '');
  const [password, setPassword] = useState(route.params?.password || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(route.params?.fromRegister || false);

  const handleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);

      if (!email || !password) {
        setError('Please enter both email and password');
        return;
      }

      const response = await authService.login({ email, password });
      await login(response.session.access_token);
    } catch (err:any) {
      console.error('Login screen error:', err);
      console.log('err: ', err, typeof err, err.message);
      if (err.message) {
        const status = err.message;
        switch (status) {
          case "401":
            setError('Invalid email or password. Please try again.');
            break;
          case "404":
            setError('Account not found. Please check your email or sign up.');
            break;
          case "429":
            setError('Too many login attempts. Please try again later.');
            break;
          default:
            setError(err.message || 'Failed to login. Please try again.');
        }
      } else if (err.message === 'Network Error') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('Failed to login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-background dark:bg-dark-background">
      <Modal
        visible={showVerificationModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowVerificationModal(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className="bg-white dark:bg-dark-surface rounded-lg p-6 m-4 w-[90%] max-w-md">
            <View className="items-center mb-4">
              <Text className="text-2xl font-bold text-primary dark:text-dark-primary mb-2">
                Verify Your Email
              </Text>
              <Text className="text-secondary dark:text-dark-secondary text-center">
                Please check your email for a verification link before logging in.
              </Text>
            </View>
            <Button 
              title="Got it" 
              onPress={() => setShowVerificationModal(false)}
            />
          </View>
        </View>
      </Modal>

      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-md">
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-primary dark:text-dark-primary mb-2">
              Welcome Back
            </Text>
            <Text className="text-secondary dark:text-dark-secondary">
              Sign in to continue
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
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              showPasswordToggle
            />
            
            <Text
              className="text-primary dark:text-dark-primary text-right mb-4"
              onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_WEB_URL}/forgot-password`)}
            >
              Forgot Password?
            </Text>
            
            <Button title="Sign In" onPress={handleLogin} loading={isLoading} disabled={isLoading} />
          </View>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-secondary dark:text-dark-secondary">
              Don't have an account?{' '}
            </Text>
            <Text
              className="text-primary dark:text-dark-primary font-medium"
              onPress={() => navigation.navigate('Register')}
            >
              Sign Up
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}; 