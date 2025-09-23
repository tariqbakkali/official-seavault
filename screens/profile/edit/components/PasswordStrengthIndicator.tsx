import * as React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';

interface PasswordStrengthIndicatorProps {
  password: string;
  passwordStrength: number;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  passwordStrength,
}) => {
  if (!password) return null;
  
  const strengthColors = ['#FF3B30', '#FF9500', '#FFCC00', '#34C759'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  
  // Original version
  return (
    <View style={styles.passwordStrengthContainer}>
      <View style={styles.passwordStrengthBars}>
        <View
          style={[
            styles.passwordStrengthBar,
            {
              backgroundColor: 0 < passwordStrength 
                ? strengthColors[Math.min(passwordStrength - 1, 3)]
                : '#333'
            }
          ]}
        />
        <View
          style={[
            styles.passwordStrengthBar,
            {
              backgroundColor: 1 < passwordStrength 
                ? strengthColors[Math.min(passwordStrength - 1, 3)]
                : '#333'
            }
          ]}
        />
        <View
          style={[
            styles.passwordStrengthBar,
            {
              backgroundColor: 2 < passwordStrength 
                ? strengthColors[Math.min(passwordStrength - 1, 3)]
                : '#333'
            }
          ]}
        />
        <View
          style={[
            styles.passwordStrengthBar,
            {
              backgroundColor: 3 < passwordStrength 
                ? strengthColors[Math.min(passwordStrength - 1, 3)]
                : '#333'
            }
          ]}
        />
      </View>
      <Text style={[styles.passwordStrengthText, { color: strengthColors[Math.min(passwordStrength - 1, 3)] }]}>
        {passwordStrength > 0 ? strengthLabels[Math.min(passwordStrength - 1, 3)] : 'Too short'}
      </Text>
    </View>
  );
};