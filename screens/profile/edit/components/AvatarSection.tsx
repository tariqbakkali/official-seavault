import * as React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Camera, AlertCircle } from 'lucide-react-native';
import ImageWithFallback from '@/components/ImageWithFallback';
import DefaultAvatar from '@/assets/images/AVATAR.png';
import { styles } from '../styles';

interface AvatarSectionProps {
  avatarUri: string | null;
  uploadingAvatar: boolean;
  avatarUploadError: boolean;
  onPickImage: () => void;
}

export const AvatarSection: React.FC<AvatarSectionProps> = ({
  avatarUri,
  uploadingAvatar,
  avatarUploadError,
  onPickImage,
}) => {
  return (
    <View style={styles.section}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={onPickImage} disabled={uploadingAvatar}>
          <View style={styles.avatarWrapper}>
            <ImageWithFallback
              uri={avatarUri}
              style={styles.avatar}
              containerStyle={styles.avatarImageContainer}
              fallbackColor="#333"
              defaultImageSource={DefaultAvatar}
            />
            <View style={styles.cameraIcon}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Camera size={20} color="#fff" />
              )}
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change profile picture</Text>
        {avatarUploadError && (
          <View style={styles.errorContainer}>
            <AlertCircle size={16} color="#FF3B30" />
            <Text style={styles.errorText}>Failed to upload image</Text>
          </View>
        )}
      </View>
    </View>
  );
};