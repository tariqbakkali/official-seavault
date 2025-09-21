import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

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
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  settingItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  signOutText: {
    color: '#FF3B30',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

export default SettingsSection;