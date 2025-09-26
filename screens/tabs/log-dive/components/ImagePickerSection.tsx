import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface SelectedImage {
  uri: string;
  type: string;
  fileName: string;
}

interface ImagePickerSectionProps {
  selectedImage: SelectedImage | null;
  onImageSelected: (image: SelectedImage) => void;
  onImageRemoved: () => void;
}

const ImagePickerSection: React.FC<ImagePickerSectionProps> = ({
  selectedImage,
  onImageSelected,
  onImageRemoved,
}) => {
  const selectImageFromGallery = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to make this work!',
        [{ text: 'OK' }]
      );
      return;
    }

    // Launch image picker
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        onImageSelected({
          uri: asset.uri,
          type: asset.type || '',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
        });
      } else if (result.canceled) {
        console.log('User cancelled image picker');
      }
    } catch (error) {
      console.error('ImagePicker Error: ', error);
      Alert.alert(
        'Error',
        'Failed to select image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Dive Photo (Optional)</Text>
      <TouchableOpacity
        style={styles.imagePicker}
        onPress={selectImageFromGallery}
      >
        {selectedImage ? (
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.selectedImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePickerPlaceholder}>
            <Text style={styles.imagePickerText}>📷</Text>
            <Text style={styles.imagePickerText}>Tap to select image</Text>
            <Text style={styles.imagePickerSubtext}>Choose a photo of your dive</Text>
          </View>
        )}
      </TouchableOpacity>
      
      {selectedImage && (
        <TouchableOpacity
          style={styles.removeImageButton}
          onPress={onImageRemoved}
        >
          <Text style={styles.removeImageButtonText}>Remove Image</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: DIMENSIONS.SPACE_XL,
  },
  label: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    backgroundColor: COLORS.SURFACE,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  imagePickerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: COLORS.TEXT_TERTIARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    marginTop: DIMENSIONS.SPACE_MD,
  },
  imagePickerSubtext: {
    color: COLORS.TEXT_DISABLED,
    fontSize: TYPOGRAPHY.SIZE_SM,
    marginTop: DIMENSIONS.SPACE_XS,
    textAlign: 'center',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: DIMENSIONS.RADIUS_MD,
  },
  removeImageButton: {
    marginTop: DIMENSIONS.SPACE_MD,
    padding: DIMENSIONS.SPACE_MD,
    backgroundColor: COLORS.ERROR,
    borderRadius: DIMENSIONS.RADIUS_MD,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  removeImageButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    marginLeft: DIMENSIONS.SPACE_XS,
  },
});

export default ImagePickerSection;