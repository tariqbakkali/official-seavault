import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, DIMENSIONS } from '@/constants';

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
  style?: object;
}

/**
 * Reusable form section component with title and consistent styling
 */
const FormSection: React.FC<FormSectionProps> = ({ 
  title, 
  children, 
  style 
}) => {
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  content: {
    // Add any additional styling for content if needed
  },
});

export default FormSection;