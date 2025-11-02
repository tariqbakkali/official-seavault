import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { useImageUpload } from '@/hooks/useImageUpload';
import { ImageMetadata } from '@/types/image.types';

interface ImagePickerProps {
  onImageSelect: (imageMetadata: ImageMetadata) => void;
  diveSiteId: string;
  disabled?: boolean;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImageSelect,
  diveSiteId,
  disabled = false,
}) => {
  const {
    isUploading,
    uploadProgress,
    error,
    launchCamera,
    launchImageLibrary,
    clearError,
  } = useImageUpload();

  // Handle camera launch
  const handleCameraLaunch = async () => {
    if (disabled) return;
    
    try {
      const imageMetadata = await launchCamera();
      if (imageMetadata) {
        onImageSelect(imageMetadata);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  // Handle library launch
  const handleLibraryLaunch = async () => {
    if (disabled) return;
    
    try {
      const imageMetadata = await launchImageLibrary();
      if (imageMetadata) {
        onImageSelect(imageMetadata);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Clear error when component unmounts or when needed
  React.useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  return (
    <View style={styles.container}>
      {isUploading ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#1a1a1a" />
          <Text style={styles.uploadProgressText}>Uploading... {uploadProgress}%</Text>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.optionButton, disabled && styles.disabledButton]}
            onPress={handleCameraLaunch}
            disabled={disabled}
          >
            <Camera size={24} color="#fff" />
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, styles.libraryButton, disabled && styles.disabledButton]}
            onPress={handleLibraryLaunch}
            disabled={disabled}
          >
            <ImageIcon size={24} color="#fff" />
            <Text style={styles.buttonText}>Choose from Library</Text>
          </TouchableOpacity>
        </>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: DIMENSIONS.SPACE_LG,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.PADDING_LG,
    borderWidth: 1,
    borderColor: '#333',
    gap: DIMENSIONS.SPACE_SM,
  },
  libraryButton: {
    backgroundColor: '#333',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
  },
  uploadingContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.PADDING_LG,
    gap: DIMENSIONS.SPACE_LG,
  },
  uploadProgressText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  errorContainer: {
    marginTop: DIMENSIONS.SPACE_LG,
    padding: DIMENSIONS.PADDING_SM,
    backgroundColor: '#ffebee',
    borderRadius: DIMENSIONS.RADIUS_SM,
  },
  errorText: {
    color: '#c62828',
    fontSize: TYPOGRAPHY.SIZE_MD,
    textAlign: 'center',
  },
});

export default ImagePicker;