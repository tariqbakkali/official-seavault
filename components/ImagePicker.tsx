import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';

interface ImagePickerProps {
  onImageSelect: (uri: string) => void;
}

export default function ImagePicker({ onImageSelect }: ImagePickerProps) {
  const [permissionResponse, requestPermission] = ExpoImagePicker.useCameraPermissions();

  const handleCameraLaunch = async () => {
    // Request camera permission if not granted
    if (!permissionResponse?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission required',
          'Camera permission is required to take photos'
        );
        return;
      }
    }

    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelect(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleLibraryLaunch = async () => {
    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ExpoImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onImageSelect(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.optionButton} onPress={handleCameraLaunch}>
        <Camera size={24} color="#fff" />
        <Text style={styles.buttonText}>Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionButton} onPress={handleLibraryLaunch}>
        <Camera size={24} color="#fff" />
        <Text style={styles.buttonText}>Choose from Library</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});