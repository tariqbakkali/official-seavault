import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ImageWithFallback } from '@/components';
import { Profile } from '@/types/database';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';

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
      {(profile?.membership_tier || profile?.is_premium === true) && (
        <View style={styles.membershipContainer}>
          {profile?.membership_tier && (
            <View style={[styles.membershipBadge, profile?.membership_tier === 'premium' && styles.premiumBadge]}>
              <Text style={[styles.membershipText, profile?.membership_tier === 'premium' && styles.premiumText]}>
                {profile?.membership_tier.charAt(0).toUpperCase() + profile?.membership_tier.slice(1)}
              </Text>
            </View>
          )}
          {profile?.is_premium === true && (
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
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.MARGIN_XL,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: DIMENSIONS.MARGIN_LG,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userName: {
    fontSize: TYPOGRAPHY.SIZE_XXXL,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: DIMENSIONS.MARGIN_XS,
  },
  userEmail: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#666',
  },
  membershipContainer: {
    flexDirection: 'row',
    gap: DIMENSIONS.GAP_SM,
    marginTop: DIMENSIONS.MARGIN_SM,
  },
  membershipBadge: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    paddingVertical: DIMENSIONS.PADDING_XS,
    borderRadius: 12,
  },
  premiumBadge: {
    backgroundColor: '#FFD700',
  },
  membershipText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#fff',
    fontWeight: '600',
  },
  premiumText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#000',
    fontWeight: '600',
  },
  editProfileButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingVertical: DIMENSIONS.PADDING_MD,
    borderRadius: 20,
    marginTop: DIMENSIONS.MARGIN_LG,
  },
  editProfileText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: '600',
  },
});

export default ProfileHeader;