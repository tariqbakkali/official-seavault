import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import { styles } from '../styles';

interface DangerZoneSectionProps {
  onDeleteAccount: () => void;
}

export const DangerZoneSection: React.FC<DangerZoneSectionProps> = ({
  onDeleteAccount,
}) => {
  return (
    <>
      <View style={[styles.section, styles.dangerSection]}>
        <TouchableOpacity 
          style={[styles.button, styles.dangerButton]}
          onPress={onDeleteAccount}
        >
          <Trash2 size={20} color="#FF3B30" />
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
    </>
  );
};