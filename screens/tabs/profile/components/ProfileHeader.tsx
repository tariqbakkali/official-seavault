import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ImageWithFallback } from '@/components';

interface ProfileHeaderProps {
  profile: any;
  onEditProfile: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onEditProfile }) => {
  return (
    <View style={styles.profileSection}>
      <View style={styles.avatarContainer}>
        <ImageWithFallback
          uri={profile?.avatar_url}
          style={styles.avatar}
          fallbackColor="#333"
        />
      </View>
      <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
      <Text style={styles.userEmail}>{profile?.email}</Text>
      <TouchableOpacity
        style={styles.editProfileButton}
        onPress={onEditProfile}
      >
        <Text style={styles.editProfileText}>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  editProfileButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  editProfileText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ProfileHeader;