import * as React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Check } from 'lucide-react-native';
import { styles } from '../styles';

interface SaveButtonProps {
  hasUnsavedChanges: boolean;
  saving: boolean;
  validationErrors: { [key: string]: string };
  onSave: () => void;
}

export const SaveButton: React.FC<SaveButtonProps> = ({
  hasUnsavedChanges,
  saving,
  validationErrors,
  onSave,
}) => {
  return (
    <View style={styles.section}>
      <TouchableOpacity 
        style={[
          styles.button, 
          styles.primaryButton,
          (!hasUnsavedChanges || saving) && styles.buttonDisabled
        ]}
        onPress={onSave}
        disabled={!hasUnsavedChanges || saving || Object.keys(validationErrors).length > 0}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Check size={20} color="#fff" />
            <Text style={styles.buttonText}>Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};