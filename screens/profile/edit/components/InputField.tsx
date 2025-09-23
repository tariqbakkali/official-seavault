import * as React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react-native';
import { Text } from 'react-native';
import { styles } from '../styles';

interface InputFieldProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  icon: React.ReactNode;
  keyboardType?: any;
  secureTextEntry?: boolean;
  toggleVisibility?: () => void;
  showToggle?: boolean;
  errorKey?: string;
  validationErrors: { [key: string]: string };
}

export const InputField: React.FC<InputFieldProps> = ({
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  secureTextEntry,
  toggleVisibility,
  showToggle,
  errorKey,
  validationErrors,
}) => {
  const hasError = errorKey && validationErrors[errorKey];
  
  return (
    <View style={styles.inputWrapper}>
      <View style={[styles.inputContainer, hasError && styles.inputError]}>
        {icon}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#666"
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
          secureTextEntry={secureTextEntry}
        />
        {showToggle && toggleVisibility && (
          <TouchableOpacity onPress={toggleVisibility} style={styles.eyeIcon}>
            {secureTextEntry ? <Eye size={20} color="#666" /> : <EyeOff size={20} color="#666" />}
          </TouchableOpacity>
        )}
        {value && !hasError && (
          <Check size={20} color="#34C759" style={styles.validIcon} />
        )}
      </View>
      {hasError && (
        <View style={styles.errorContainer}>
          <AlertCircle size={14} color="#FF3B30" />
          <Text style={styles.errorText}>{validationErrors[errorKey!]}</Text>
        </View>
      )}
    </View>
  );
};