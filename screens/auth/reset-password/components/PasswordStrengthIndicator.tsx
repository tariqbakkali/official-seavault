import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
  
  return (
    <View style={styles.passwordStrengthContainer}>
      <View style={styles.passwordStrengthBars}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.passwordStrengthBar,
              {
                backgroundColor: index < passwordStrength 
                  ? strengthColors[Math.min(passwordStrength - 1, 3)]
                  : '#333'
              }
            ]}
          />
        ))}
      </View>
      <Text style={[styles.passwordStrengthText, { color: strengthColors[Math.min(passwordStrength - 1, 3)] }]}>
        {passwordStrength > 0 ? strengthLabels[Math.min(passwordStrength - 1, 3)] : 'Too short'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  passwordStrengthContainer: {
    gap: 8,
  },
  passwordStrengthBars: {
    flexDirection: 'row',
    gap: 4,
  },
  passwordStrengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333',
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});