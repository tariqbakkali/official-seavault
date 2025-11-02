import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';

interface SettingsSectionProps {
  onDownloadCatalog: () => void;
  onForceSync: () => void;
  onSignOut: () => void;
  loading?: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ onDownloadCatalog, onForceSync, onSignOut, loading = false }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      <TouchableOpacity style={styles.settingItem} onPress={onDownloadCatalog} disabled={loading}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.settingText}>Downloading...</Text>
          </View>
        ) : (
          <Text style={styles.settingText}>Download Latest Catalog</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingItem} onPress={onForceSync} disabled={loading}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.settingText}>Syncing...</Text>
          </View>
        ) : (
          <Text style={styles.settingText}>Force Sync</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingItem} onPress={onSignOut} disabled={loading}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={[styles.settingText, styles.signOutText]}>Processing...</Text>
          </View>
        ) : (
          <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.MARGIN_XL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: DIMENSIONS.MARGIN_LG,
  },
  settingItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.MARGIN_MD,
  },
  settingText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
    fontWeight: '500',
  },
  signOutText: {
    color: '#FF3B30',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.GAP_MD,
  },
});

export default SettingsSection;