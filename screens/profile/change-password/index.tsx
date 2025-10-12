import * as React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useChangePassword } from '@/screens/profile/change-password/hooks/useChangePassword';
import { InputField } from '@/screens/profile/edit/components/InputField';
import { PasswordStrengthIndicator } from '@/screens/profile/edit/components/PasswordStrengthIndicator';
import { LoadingView } from '@/screens/profile/edit/components/LoadingView';
import { Lock } from 'lucide-react-native';
import { styles } from '@/screens/profile/edit/styles';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const {
    // State
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
    loading,
    saving,
    validationErrors,
    passwordStrength,
    
    // Functions
    handleChangePassword,
    handleBack,
  } = useChangePassword();

  // Show loading screen while loading
  if (loading) {
    return <LoadingView insets={insets} />;
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { 
        paddingTop: insets.top, 
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        // Allow maps to handle gestures by not intercepting them
        onStartShouldSetResponderCapture={() => false}
        onMoveShouldSetResponderCapture={() => false}
        onResponderTerminationRequest={() => false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Update Your Password</Text>
          <Text style={styles.sectionSubtitle}>Enter your current password and a new password</Text>
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
        </View>
        
        <View style={{ paddingHorizontal: 20 }}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton, { marginTop: 20 }]}
            onPress={handleChangePassword}
            disabled={saving || Object.keys(validationErrors).some(key => key.includes('Password')) || !currentPassword || !newPassword || !confirmPassword}
          >
            <Text style={styles.buttonText}>
              {saving ? 'Updating...' : 'Update Password'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}