import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { User, Check } from 'lucide-react-native';
import { InputField } from './InputField';
import { styles } from '../styles';

interface PersonalInfoSectionWithSaveProps {
  fullName: string;
  setFullName: (name: string) => void;
  validationErrors: { [key: string]: string };
  hasUnsavedChanges: boolean;
  saving: boolean;
  onSave: () => void;
}

export const PersonalInfoSectionWithSave: React.FC<PersonalInfoSectionWithSaveProps> = ({
  fullName,
  setFullName,
  validationErrors,
  hasUnsavedChanges,
  saving,
  onSave,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      <View style={styles.inputGroup}>
        <InputField
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full Name"
          icon={<User size={20} color="#666" style={styles.inputIcon} />}
          keyboardType="default"
          secureTextEntry={false}
          showToggle={false}
          errorKey="fullName"
          validationErrors={validationErrors}
        />
      </View>
      
      {/* Save Button */}
      <TouchableOpacity 
        style={[
          styles.button, 
          styles.primaryButton,
          { marginTop: 20 }, // Add space between inputs and save button
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