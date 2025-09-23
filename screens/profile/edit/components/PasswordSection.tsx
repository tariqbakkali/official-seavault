import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Lock } from 'lucide-react-native';
import { InputField } from './InputField';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { styles } from '../styles';

interface PasswordSectionProps {
  currentPassword: string;
  setCurrentPassword: (password: string) => void;
  newPassword: string;
  setNewPassword: (password: string) => void;
  confirmPassword: string;
  setConfirmPassword: (password: string) => void;
  showCurrentPassword: boolean;
  setShowCurrentPassword: (show: boolean) => void;
  showNewPassword: boolean;
  setShowNewPassword: (show: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (show: boolean) => void;
  passwordStrength: number;
  validationErrors: { [key: string]: string };
  onChangePassword: () => void;
  saving: boolean;
}

export const PasswordSection: React.FC<PasswordSectionProps> = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrentPassword,
  setShowCurrentPassword,
  showNewPassword,
  setShowNewPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  passwordStrength,
  validationErrors,
  onChangePassword,
  saving,
}) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Change Password</Text>
      <Text style={styles.sectionSubtitle}>Leave blank to keep current password</Text>
      <View style={styles.inputGroup}>
        <InputField
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current Password"
          icon={<Lock size={20} color="#666" style={styles.inputIcon} />}
          keyboardType="default"
          secureTextEntry={!showCurrentPassword}
          toggleVisibility={() => setShowCurrentPassword(!showCurrentPassword)}
          showToggle={true}
          validationErrors={validationErrors}
        />
        <InputField
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New Password"
          icon={<Lock size={20} color="#666" style={styles.inputIcon} />}
          keyboardType="default"
          secureTextEntry={!showNewPassword}
          toggleVisibility={() => setShowNewPassword(!showNewPassword)}
          showToggle={true}
          errorKey="newPassword"
          validationErrors={validationErrors}
        />
        <PasswordStrengthIndicator password={newPassword} passwordStrength={passwordStrength} />
        <InputField
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm New Password"
          icon={<Lock size={20} color="#666" style={styles.inputIcon} />}
          keyboardType="default"
          secureTextEntry={!showConfirmPassword}
          toggleVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
          showToggle={true}
          errorKey="confirmPassword"
          validationErrors={validationErrors}
        />
      </View>
      
      {(currentPassword || newPassword || confirmPassword) && (
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton, { marginTop: 20 }]}
          onPress={onChangePassword}
          disabled={saving || Object.keys(validationErrors).some(key => key.includes('Password'))}
        >
          <Text style={styles.buttonText}>Update Password</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};