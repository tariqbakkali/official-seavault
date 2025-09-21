import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Camera, User, Lock, Trash2, AlertCircle, Mail, AtSign } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Linking from 'expo-linking';
import { supabase, uploadImage } from '@/services/supabase';
import { syncService } from '@/services/syncService';
import { 
  saveCatalogCache,
  saveUserDataCache,
  saveDiveSitesCache,
  setStorageItem,
  getStorageItem,
  saveJson,
  loadJson,
  queueOperation,
  getQueuedOperations,
  removeQueuedOperation,
  loadUserDataCache
} from '@/services/cache';
import { Profile } from '@/types/database';
import ImageWithFallback from '@/components/ImageWithFallback';
import { AuthError } from '@supabase/auth-js';

export default function EditProfileScreen() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
  const [avatarUploadError, setAvatarUploadError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const userData = await loadUserDataCache();
      if (userData?.profile) {
        setProfile(userData.profile);
        setFullName(userData.profile.full_name || '');
        setEmail(userData.profile.email || '');
        setAvatarUri(userData.profile.avatar_url);
        setAvatarUploadError(false); // Reset error state when loading
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handlePickImage = async () => {
    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setAvatarUri(result.assets[0].uri);
        setAvatarUploadError(false); // Reset error state when selecting new image
        console.log('Image selected, URI:', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    // Validate email if it has been changed
    if (email !== profile.email && !isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to update profile');
        return;
      }

      let avatarUrl = profile.avatar_url;

      // Upload new avatar if changed
      if (avatarUri && avatarUri !== profile.avatar_url && avatarUri.startsWith('file://')) {
        console.log('Uploading new avatar:', avatarUri);
        const imagePath = `avatars/${user.id}/${Date.now()}.jpg`;
        const uploadedUrl = await uploadImage(avatarUri, 'avatars', imagePath);
        console.log('Upload result:', uploadedUrl);
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
          setAvatarUploadError(false); // Clear error if upload succeeds
        } else {
          console.error('Failed to upload image');
          setAvatarUploadError(true); // Set error state
          // Ask user if they want to continue without avatar
          return new Promise<void>((resolve) => {
            Alert.alert(
              'Avatar Upload Failed',
              'Failed to upload profile picture. Do you want to save your other changes without updating your avatar?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve()
                },
                {
                  text: 'Save Without Avatar',
                  style: 'default',
                  onPress: async () => {
                    try {
                      // Continue with profile update without avatar
                      const updatedProfile = {
                        id: user.id,
                        full_name: fullName.trim(),
                        email: email.trim(),
                        avatar_url: profile.avatar_url, // Keep existing avatar
                      };

                      const { error } = await (supabase as any)
                        .from('profiles')
                        .update(updatedProfile)
                        .eq('id', user.id);

                      if (error) throw error;

                      // If email has changed, update auth email as well
                      if (email !== profile.email) {
                        const { error: authError } = await supabase.auth.updateUser({
                          email: email.trim()
                        });

                        if (authError) {
                          console.error('Failed to update auth email:', authError);
                          Alert.alert(
                            'Warning', 
                            'Profile updated but email update failed. You may need to verify your new email address.'
                          );
                        } else {
                          Alert.alert(
                            'Email Update Required', 
                            'We have sent a confirmation email to your new address. Please check your email to confirm the change.'
                          );
                        }
                      }

                      // Sync data
                      await syncService.pullUserData();

                      // Force a full app reload to update all cached data
                      await syncService.fullSync();
                      Alert.alert('Success', 'Profile updated successfully (without avatar)', [
                        { text: 'OK', onPress: () => router.back() }
                      ]);
                    } catch (error: any) {
                      if (error instanceof AuthError) {
                        Alert.alert('Error', error.message || 'Failed to update profile');
                      } else {
                        Alert.alert('Error', 'An unexpected error occurred');
                      }
                    } finally {
                      setSaving(false);
                      resolve();
                    }
                  }
                }
              ]
            );
          });
        }
      }

      // Update profile
      const updatedProfile = {
        id: user.id,
        full_name: fullName.trim(),
        email: email.trim(),
        avatar_url: avatarUrl,
      };

      const { error } = await (supabase as any)
        .from('profiles')
        .update(updatedProfile)
        .eq('id', user.id);

      if (error) throw error;

      // If email has changed, update auth email as well
      if (email !== profile.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email.trim()
        });

        if (authError) {
          console.error('Failed to update auth email:', authError);
          Alert.alert(
            'Warning', 
            'Profile updated but email update failed. You may need to verify your new email address.'
          );
        } else {
          Alert.alert(
            'Email Update Required', 
            'We have sent a confirmation email to your new address. Please check your email to confirm the change.'
          );
        }
      }

      // Sync data
      await syncService.pullUserData();

      // Force a full app reload to update all cached data
      await syncService.fullSync();
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      if (error instanceof AuthError) {
        Alert.alert('Error', error.message || 'Failed to update profile');
      } else {
        Alert.alert('Error', 'An unexpected error occurred');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    // If current password is provided, verify it and update directly
    if (currentPassword) {
      setSaving(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) {
          Alert.alert('Error', 'Unable to verify current user');
          return;
        }

        // First verify current password by attempting to sign in with it
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword
        });

        if (signInError) {
          Alert.alert('Error', 'Current password is incorrect');
          return;
        }

        // Update password
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        });

        if (error) throw error;

        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        Alert.alert('Success', 'Password updated successfully');
        
        // Reload user data after password change
        await syncService.pullUserData();
      } catch (error: any) {
        if (error instanceof AuthError) {
          Alert.alert('Error', error.message || 'Failed to update password');
        } else {
          Alert.alert('Error', 'An unexpected error occurred');
        }
      } finally {
        setSaving(false);
      }
    } else {
      // If current password is not provided, offer to send password reset email
      Alert.alert(
        'Reset Password',
        'Since you did not provide your current password, we will send a password reset email to your registered email address.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send Reset Email',
            onPress: async () => {
              setSaving(true);
              try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user?.email) {
                  Alert.alert('Error', 'Unable to get your email address');
                  return;
                }

                const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
                  redirectTo: Linking.createURL('login'),
                });

                if (error) throw error;

                Alert.alert(
                  'Password Reset Email Sent',
                  'Check your email for instructions to reset your password.'
                );
                
                // Clear password fields
                setNewPassword('');
                setConfirmPassword('');
              } catch (error: any) {
                if (error instanceof AuthError) {
                  Alert.alert('Error', error.message);
                } else {
                  console.error('Unexpected error:', error);
                  Alert.alert('Error', 'An unexpected error occurred. Please try again.');
                }
              } finally {
                setSaving(false);
              }
            }
          }
        ]
      );
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your dive logs, sightings, and profile data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Show a second confirmation
            Alert.alert(
              'Final Confirmation',
              'This will permanently delete your account and all data. Are you absolutely sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: performAccountDeletion
                }
              ]
            );
          },
        },
      ]
    );
  };

  const performAccountDeletion = async () => {
    try {
      setSaving(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No user found to delete');
        return;
      }

      // Delete user data from our tables first
      const { error: deleteDataError } = await supabase.rpc('delete_user_data', {
        user_id: user.id
      } as any);

      if (deleteDataError) {
        console.error('Error deleting user data:', deleteDataError);
        // Continue with account deletion even if this fails
      }

      // Sign out the user (this is the secure way to "delete" the account from the client side)
      // The actual user deletion should be handled by a backend function or database trigger
      await supabase.auth.signOut();

      // Clear all local data comprehensively
      try {
        // Clear AsyncStorage
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.clear();
        
        // Clear file system caches
        // Note: In a production app, you might want to clear specific keys rather than everything
        // For now, we'll just clear the cache files by saving empty data
        await saveCatalogCache({
          categories: [],
          creatures: [],
          lastSyncAt: new Date().toISOString()
        });
        
        await saveUserDataCache({
          profile: null,
          sightings: [],
          wishlists: [],
          achievements: [],
          stats: {
            totalPoints: 0,
            uniqueCreatures: 0,
            overallCompletion: 0,
            categoryStats: {},
            categoryNames: {}
          },
          lastSyncAt: new Date().toISOString()
        });
        
        await saveDiveSitesCache([]);
        
        // Clear any queued operations
        const operations = await getQueuedOperations();
        for (const operation of operations) {
          await removeQueuedOperation(operation.clientId);
        }
        
        // Clear storage items
        await setStorageItem('isOffline', 'false');
        await setStorageItem('lastCatalogSyncAt', '');
        await setStorageItem('lastUserSyncAt', '');
        
        // Clear JSON files
        await saveJson('catalog.json', null);
        await saveJson('user-data.json', null);
        await saveJson('dive_sites.json', null);
      } catch (clearError) {
        console.error('Error clearing local storage:', clearError);
      }

      // Navigate to login
      router.replace('/(auth)/login');
      
      Alert.alert(
        'Account Deleted', 
        'Your account and all associated data have been permanently deleted.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Account deletion error:', error);
      if (error instanceof AuthError) {
        Alert.alert(
          'Error', 
          error.message || 'Failed to delete account completely. Please contact support if you continue to have issues.',
          [
            { text: 'Sign Out Anyway', onPress: async () => {
              try {
                await supabase.auth.signOut();
                router.replace('/(auth)/login');
              } catch (error: any) {
                console.error('Sign out error:', error);
                if (error instanceof AuthError) {
                  console.error('Sign out error:', error.message);
                }
              }
            }},
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert(
          'Error', 
          'An unexpected error occurred. Please contact support if you continue to have issues.',
          [
            { text: 'Sign Out Anyway', onPress: async () => {
              try {
                await supabase.auth.signOut();
                router.replace('/(auth)/login');
              } catch (error: any) {
                console.error('Sign out error:', error);
                if (error instanceof AuthError) {
                  console.error('Sign out error:', error.message);
                }
              }
            }},
            { text: 'Cancel', style: 'cancel' }
          ]
        );
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <ImageWithFallback
                uri={avatarUri || profile?.avatar_url}
                style={styles.avatar}
                fallbackColor="#333"
              />
              {avatarUploadError && (
                <View style={styles.avatarErrorOverlay}>
                  <AlertCircle size={24} color="#FF3B30" />
                </View>
              )}
            </View>
            {avatarUploadError && (
              <View style={styles.avatarErrorContainer}>
                <AlertCircle size={16} color="#FF3B30" />
                <Text style={styles.avatarErrorText}>Failed to upload avatar</Text>
              </View>
            )}
            <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
              <Camera size={16} color="#007AFF" />
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.inputContainer}>
            <User size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#666"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          <View style={styles.inputContainer}>
            <AtSign size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSaveProfile}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <View style={styles.inputContainer}>
            <Lock size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Current Password (optional)"
              placeholderTextColor="#666"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />
          </View>
          <View style={styles.inputContainer}>
            <Lock size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              placeholderTextColor="#666"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />
          </View>
          <View style={styles.inputContainer}>
            <Lock size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              placeholderTextColor="#666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleChangePassword}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Update Password</Text>
            )}
          </TouchableOpacity>
          
          {!currentPassword && (
            <View style={styles.passwordResetInfo}>
              <Mail size={16} color="#666" />
              <Text style={styles.passwordResetInfoText}>
                Leave current password blank to receive a password reset email
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            disabled={saving}
          >
            <Trash2 size={20} color="#FF3B30" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarErrorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  avatarErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  avatarErrorText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePhotoText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordResetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  passwordResetInfoText: {
    color: '#666',
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});