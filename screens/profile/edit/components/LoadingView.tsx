import * as React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { styles } from '../styles';

interface LoadingViewProps {
  insets: any;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ insets }) => {
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    </View>
  );
};