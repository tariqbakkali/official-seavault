import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ImageWithFallback } from '@/components';
import { Profile } from '@/types/database';

interface ProfileHeaderProps {
  profile: Profile;
  onEditProfile: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onEditProfile }: { profile: ProfileHeaderProps['profile'], onEditProfile: ProfileHeaderProps['onEditProfile'] }) => {
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
      
      {/* Membership tier and premium status */}
      {(profile?.membership_tier || profile?.is_premium) && (
        <View style={styles.membershipContainer}>
          {profile?.membership_tier && (
            <View style={[styles.membershipBadge, profile?.membership_tier === 'premium' && styles.premiumBadge]}>
              <Text style={[styles.membershipText, profile?.membership_tier === 'premium' && styles.premiumText]}>
                {profile?.membership_tier.charAt(0).toUpperCase() + profile?.membership_tier.slice(1)}
              </Text>
            </View>
          )}
          {profile?.is_premium && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>
      )}
      
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
  membershipContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  membershipBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
  },
  membershipText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  premiumText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
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