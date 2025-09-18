import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface SettingsSectionProps {
  onDownloadCatalog: () => void;
  onForceSync: () => void;
  onSignOut: () => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ onDownloadCatalog, onForceSync, onSignOut }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings</Text>
      
      <TouchableOpacity style={styles.settingItem} onPress={onDownloadCatalog}>
        <Text style={styles.settingText}>Download Latest Catalog</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingItem} onPress={onForceSync}>
        <Text style={styles.settingText}>Force Sync</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.settingItem} onPress={onSignOut}>
        <Text style={[styles.settingText, styles.signOutText]}>Sign Out</Text>
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
});

export default SettingsSection;