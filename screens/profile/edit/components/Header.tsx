import * as React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { styles } from '../styles';

interface HeaderProps {
  onBack: () => void;
  hasUnsavedChanges: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  hasUnsavedChanges,
}) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <ArrowLeft size={24} color="#fff" />
      </TouchableOpacity>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={styles.title}>Edit Profile</Text>
      </View>
      {hasUnsavedChanges ? (
        <View style={styles.unsavedIndicator}>
          <Text style={styles.unsavedText}>•</Text>
        </View>
      ) : (
        <View style={{ width: 40 }} /> // Spacer to maintain alignment
      )}
    </View>
  );
};