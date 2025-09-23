import * as React from 'react';
import { router } from 'expo-router';
import { supabase } from '@/services/supabase';
import { showAlert } from '@/utils/alertUtils';
import { calculatePasswordStrength, validateProfileForm } from '@/screens/profile/edit/utils/profileUtils';
import { isValidEmail } from '@/screens/auth/login/utils/authValidation';

export const useChangePassword = () => {
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<{[key: string]: string}>({});
  const [passwordStrength, setPasswordStrength] = React.useState(0);

  // Password strength calculator
  React.useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword));
  }, [newPassword]);

  // Real-time validation
  React.useEffect(() => {
    // We only need to validate password fields for this screen
    const errors: { [key: string]: string } = {};
    
    if (newPassword) {
      if (newPassword.length < 6) {
        errors.newPassword = 'Password must be at least 6 characters';
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    setValidationErrors(errors);
  }, [newPassword, confirmPassword]);

  // Handle password change
  const handleChangePassword = React.useCallback(async () => {
    if (Object.keys(validationErrors).some(key => key.includes('Password'))) {
      showAlert('Validation Error', 'Please fix password errors before updating');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Error', 'Please fill in all password fields');
      return;
    }

    setSaving(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showAlert('Success', 'Password updated successfully', () => {
        // Clear form fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Navigate back
        router.back();
      });
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }, [validationErrors, currentPassword, newPassword, confirmPassword]);

  // Handle back navigation
  const handleBack = React.useCallback(() => {
    router.back();
  }, []);

  return {
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
  };
};