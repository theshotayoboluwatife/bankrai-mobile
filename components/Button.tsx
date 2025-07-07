import { TouchableOpacity, Text, TouchableOpacityProps } from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export const Button = ({ title, variant = 'primary', loading, disabled, ...props }: ButtonProps) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'primary':
        return 'bg-primary dark:bg-dark-primary';
      case 'secondary':
        return 'bg-secondary dark:bg-dark-secondary';
      case 'outline':
        return 'border border-primary dark:border-dark-primary bg-transparent';
      default:
        return 'bg-primary dark:bg-dark-primary';
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline':
        return 'text-primary dark:text-dark-primary';
      case 'primary':
        return 'text-white dark:text-dark-background';
      case 'secondary':
        return 'text-white dark:text-dark-background';
      default:
        return 'text-white dark:text-dark-background';
    }
  };

  return (
    <TouchableOpacity
      className={`px-4 py-3 rounded-md ${getButtonStyle()} ${disabled ? 'opacity-50' : ''}`}
      activeOpacity={0.8}
      disabled={disabled}
      {...props}
    >
      <Text className={`text-center font-medium ${getTextStyle()}`}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
}; 