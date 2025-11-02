import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
  numberOfLines?: number;
  required?: boolean;
  error?: string;
}

/**
 * Reusable form field component with label and styling
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  required = false,
  error
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          error && styles.inputError
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  label: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  required: {
    color: '#ff3b30',
  },
  input: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.PADDING_MD,
    backgroundColor: '#1a1a1a',
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
  },
  inputError: {
    borderColor: '#ff3b30',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#ff3b30',
    fontStyle: 'italic',
    marginTop: DIMENSIONS.SPACE_XS,
  },
});

export default FormField;