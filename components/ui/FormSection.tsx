import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
});

export default FormSection;