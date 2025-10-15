import * as React from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Profile } from '@/types/database';
import { useSyncedData } from '@/hooks/useSyncedData';
import { showAlert } from '@/utils/alertUtils';
import { supabase, uploadImage } from '@/services/supabase';
import { router } from 'expo-router';
import { AuthError } from '@supabase/auth-js';
import { hasUnsavedChanges, validateProfileForm } from '../utils/profileUtils';
import { clearUserSync } from '@/utils/syncUtils';

export const useProfile = (): {
  // State
  profile: Profile | undefined;
  fullName: string;
  setFullName: React.Dispatch<React.SetStateAction<string>>;
  avatarUri: string | null;
  setAvatarUri: React.Dispatch<React.SetStateAction<string | null>>;
  avatarUploadError: boolean;
  setAvatarUploadError: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  saving: boolean;
  uploadingAvatar: boolean;
  setUploadingAvatar: React.Dispatch<React.SetStateAction<boolean>>;
  hasUnsavedChangesState: boolean;
  validationErrors: { [key: string]: string };
  
  // Functions
  loadProfileData: () => Promise<void>;
  handlePickImage: () => Promise<void>;
  handleSaveProfile: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
  handleBack: () => void;
} => {
  const [fullName, setFullName] = React.useState('');
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const [avatarUploadError, setAvatarUploadError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [hasUnsavedChangesState, setHasUnsavedChangesState] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<{[key: string]: string}>({});

  let { profile, fetchUserData, updateUserProfile } = useSyncedData();
  const typedProfile: Profile | undefined = profile ? Object.values(profile)[0] : undefined;


  // Load profile data
  const loadProfileData = React.useCallback(async () => {
    try {
      await fetchUserData();
      // Get the profile data from the observable
      const profileData: Profile | undefined = typedProfile;
      if (profileData && !fullName) { // Only set initial values if fullName is empty
        setFullName(profileData.full_name || '');
        setAvatarUri(profileData.avatar_url);
        setAvatarUploadError(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      showAlert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, [fetchUserData, typedProfile, fullName]);

  // Track changes for unsaved changes warning (without email)
  // Use a ref to track the last saved profile data to avoid resetting local state
  const lastSavedProfileRef = React.useRef<{ fullName: string | null; avatarUrl: string | null } | null>(null);
  
  React.useEffect(() => {
    // Initialize the ref with the initial profile data
    if (typedProfile && !lastSavedProfileRef.current) {
      lastSavedProfileRef.current = {
        fullName: typedProfile.full_name || '',
        avatarUrl: typedProfile.avatar_url || null
      };
    }
    
    // Only check fullName and avatar changes since email cannot be changed
    const hasChanges = typedProfile && (
      fullName !== (lastSavedProfileRef.current?.fullName || '') ||
      avatarUri !== (lastSavedProfileRef.current?.avatarUrl || null)
    );
    setHasUnsavedChangesState(!!hasChanges);
  }, [fullName, avatarUri, typedProfile]);

  // Real-time validation (without email)
  React.useEffect(() => {
    // Only validate fullName since email is not editable
    const errors: { [key: string]: string } = {};

    if (fullName && fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters';
    }

    setValidationErrors(errors);
  }, [fullName]);

  // Handle image picking
  const handlePickImage = React.useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingAvatar(true);
        setAvatarUri(result.assets[0].uri);
        setAvatarUploadError(false);
        
        // Simulate upload delay for better UX feedback
        setTimeout(() => setUploadingAvatar(false), 1000);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      showAlert('Error', 'Failed to pick image');
      setUploadingAvatar(false);
    }
  }, []);

  // Handle saving profile (without email update)
  const handleSaveProfile = React.useCallback(async () => {
    if (Object.keys(validationErrors).length > 0) {
      showAlert('Validation Error', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);
    
    try {
      const userId = typedProfile?.id;
      if (!userId) {
        showAlert('Error', 'Please sign in to update profile');
        return;
      }

      // Get current profile data from observable
      const profileData: Profile | undefined = typedProfile;
      let avatarUrl = profileData?.avatar_url || null;

      // Upload new avatar if changed
      if (avatarUri && avatarUri !== (profileData?.avatar_url || null) && avatarUri.startsWith('file://')) {
        const userId = typedProfile?.id;
        const imagePath = `avatars/${userId}/${Date.now()}.jpg`;
        const uploadedUrl = await uploadImage(avatarUri, 'avatars', imagePath);
        
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          setAvatarUploadError(false);
        } else {
          setAvatarUploadError(true);
          throw new Error('Failed to upload avatar');
        }
      }

      const updatedProfile = {
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        // Email is not included in the update since it cannot be changed
      };

      await updateUserProfile(updatedProfile);

      // Update the ref with the saved values
      lastSavedProfileRef.current = {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl
      };

      setHasUnsavedChangesState(false);
      
      setTimeout(() => {
        showAlert('Success', 'Profile updated successfully', () => router.back());
      }, 500);
      
    } catch (error: any) {
      if (error instanceof AuthError) {
        showAlert('Error', error.message || 'Failed to update profile');
      } else {
        showAlert('Error', error.message || 'An unexpected error occurred');
      }
    } finally {
      setSaving(false);
    }
  }, [validationErrors, fullName, avatarUri, typedProfile, updateUserProfile]);

  // Handle account deletion
  const handleDeleteAccount = React.useCallback(async () => {
    showAlert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      async () => {
        try {
          // Get current profile data from observable to get user ID
          const profileData: Profile | undefined = typedProfile;
          
          // Sign out the user first
          
          // Clear user sync data on account deletion
          clearUserSync();
          
          // Get the current session
          const { data: { session } } = await supabase.auth.getSession();
          
          // Call the deployed Supabase function to delete the user account
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`,
          };
          
          // Only add the admin token header if it's defined
          if (process.env.ADMIN_DELETE_TOKEN) {
            headers['x-admin-token'] = process.env.ADMIN_DELETE_TOKEN;
          }

          console.log("User_ID Profile data : ", profileData)
          
          const response = await fetch('https://hqqebvozpvwpopxtixyt.supabase.co/functions/v1/delete-user-auth', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              user_id: profileData?.id || ''
            })
          });
          
          const result = await response.json();
          
          if (!response.ok || !result.success) {
            throw new Error(result.error || 'Failed to delete account');
          }
          await supabase.auth.signOut();
          
          showAlert('Success', 'Account deleted successfully');
          router.replace('/(auth)/login');
        } catch (error: any) {
          showAlert('Error', error.message || 'Failed to delete account');
        }
      }
    );
  }, [typedProfile]);

  // Handle back navigation
  const handleBack = React.useCallback(() => {
    if (hasUnsavedChangesState) {
      showAlert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to leave?',
        () => router.back()
      );
    } else {
      router.back();
    }
  }, [hasUnsavedChangesState]);

  return {
    // State
    profile: typedProfile, // Return the actual profile data, not the observable
    fullName,
    setFullName,
    avatarUri,
    setAvatarUri,
    avatarUploadError,
    setAvatarUploadError,
    loading,
    saving,
    uploadingAvatar,
    setUploadingAvatar,
    hasUnsavedChangesState,
    validationErrors,
    
    // Functions
    loadProfileData,
    handlePickImage,
    handleSaveProfile,
    handleDeleteAccount,
    handleBack,
  };
};