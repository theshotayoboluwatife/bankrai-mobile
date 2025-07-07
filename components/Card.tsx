import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export const Card = ({ children, className = '', ...props }: CardProps) => {
  return (
    <View
      className={`bg-white dark:bg-dark-surface border border-gray-200 dark:border-gray-700 rounded-md ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}; 