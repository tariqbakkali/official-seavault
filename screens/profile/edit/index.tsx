import * as React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useProfile } from './hooks/useProfile';
import { LoadingView } from './components/LoadingView';
import { AvatarSection } from './components/AvatarSection';
import { PersonalInfoSectionWithSave } from './components/PersonalInfoSectionWithSave';
import { Lock } from 'lucide-react-native';
import { styles } from './styles';
import ScreenHeader from '@/components/ui/ScreenHeader';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    // State
    fullName,
    setFullName,
    avatarUri,
    avatarUploadError,
    loading,
    saving,
    uploadingAvatar,
    hasUnsavedChangesState,
    validationErrors,
    
    // Functions
    loadProfileData,
    handlePickImage,
    handleSaveProfile,
    handleDeleteAccount,
    handleBack,
  } = useProfile();

  // Load profile data on component mount
  React.useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Navigate to change password screen
  const handleChangePassword = React.useCallback(() => {
    router.push('/profile/change-password');
  }, []);

  // Show loading screen while loading
  if (loading) {
    return <LoadingView insets={insets} />;
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScreenHeader 
        title="Edit Profile"
        onBackPress={handleBack}
        showBackButton={true}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <AvatarSection
          avatarUri={avatarUri}
          uploadingAvatar={uploadingAvatar}
          avatarUploadError={avatarUploadError}
          onPickImage={handlePickImage}
        />
        
        <PersonalInfoSectionWithSave
          fullName={fullName}
          setFullName={setFullName}
          validationErrors={validationErrors}
          hasUnsavedChanges={hasUnsavedChangesState}
          saving={saving}
          onSave={handleSaveProfile}
        />
        
        {/* Change Password Button */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={handleChangePassword}
          >
            <Lock size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Change Password</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.section, styles.dangerSection, { marginTop: 8 }]}>
          <TouchableOpacity 
            style={[styles.button, styles.dangerButton]}
            onPress={handleDeleteAccount}
          >
            <Lock size={20} color="#FF3B30" />
            <Text style={[styles.buttonText, styles.dangerButtonText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity onPress={() => Linking.openURL('https://seavault.app/privacy')}>
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://seavault.app/terms')}>
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 50 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}