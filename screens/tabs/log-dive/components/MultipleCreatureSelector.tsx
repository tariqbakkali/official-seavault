import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { documentDirectory, moveAsync, makeDirectoryAsync } from 'expo-file-system/legacy';
let VideoThumbnails: any = null;
try {
  VideoThumbnails = require('expo-video-thumbnails');
} catch (e) {
  console.warn('[MultipleCreatureSelector] VideoThumbnails not available');
}
import { v4 as uuidv4 } from 'uuid';
import { Camera, Image as ImageIcon, X, Trash2, ChevronRight, ChevronLeft, Plus, Check, Search, Fish, Video } from 'lucide-react-native';
import { DIMENSIONS, TYPOGRAPHY, COLORS } from '@/constants';
import UniversalCreaturePicker from './UniversalCreaturePicker';

interface CreatureSighting {
  id: string; // tempId
  creatureId: string | null;
  notes: string | null;
  imageUrl: string | null;
  mediaType: 'image' | 'video' | null;
  thumbnailUrl: string | null;
}

interface MultipleCreatureSelectorProps {
  catalog: any;
  selectedCategories: string[];
  creatureSightings: CreatureSighting[];
  onCategoryChange: (categories: string[]) => void;
  onCreatureSightingsChange: (sightings: CreatureSighting[]) => void;
}

const MultipleCreatureSelector: React.FC<MultipleCreatureSelectorProps> = ({
  catalog,
  selectedCategories,
  creatureSightings,
  onCategoryChange,
  onCreatureSightingsChange,
}) => {
  const [showPicker, setShowPicker] = useState(false);

  // Optimize creature lookup
  const creaturesById = useMemo(() => {
    const lookup: Record<string, any> = {};
    if (catalog?.creatures) {
      catalog.creatures.forEach((c: any) => {
        lookup[c.id] = c;
      });
    }
    return lookup;
  }, [catalog]);

  // Add creatures from the picker
  const handleAddCreatures = (selectedCreatures: any[]) => {
    const newSightings = selectedCreatures.map(creature => ({
      id: uuidv4(),
      creatureId: creature.id,
      notes: null,
      imageUrl: null,
      mediaType: null,
      thumbnailUrl: null,
    }));

    onCreatureSightingsChange([...creatureSightings, ...newSightings]);
  };

  // Update a specific creature sighting
  const updateCreatureSighting = (index: number, updates: Partial<CreatureSighting>) => {
    const updatedSightings = [...creatureSightings];
    updatedSightings[index] = { ...updatedSightings[index], ...updates };
    onCreatureSightingsChange(updatedSightings);
  };

  // Select image for a specific creature sighting
  const selectImageForCreature = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Need camera roll permissions!');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileExt = asset.uri.split('.').pop() || (asset.type === 'video' ? 'mp4' : 'jpg');
        const fileName = `${uuidv4()}.${fileExt}`;
        const mediaDir = `${documentDirectory}media/`;
        const newUri = `${mediaDir}${fileName}`;

        let finalImageUrl = null;
        let finalMediaType: 'image' | 'video' | null = null;
        let finalThumbnailUrl = null;

        try {
          await makeDirectoryAsync(mediaDir, { intermediates: true });
          await moveAsync({ from: asset.uri, to: newUri });
          finalImageUrl = newUri;
          finalMediaType = asset.type === 'video' ? 'video' : 'image';

          if (asset.type === 'video' && VideoThumbnails) {
            try {
              const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(newUri, { time: 1000 });
              const thumbName = `thumb-${uuidv4()}.jpg`;
              const persistentThumbUri = `${mediaDir}${thumbName}`;
              await moveAsync({ from: thumbUri, to: persistentThumbUri });
              finalThumbnailUrl = persistentThumbUri;
            } catch (thumbError) {
              console.warn('[MultipleCreatureSelector] Failed to generate thumbnail:', thumbError);
            }
          }
        } catch (e) {
          console.error('[MultipleCreatureSelector] Persistence error:', e);
          // Fallback to using original URI if persistence fails
          finalImageUrl = asset.uri;
          finalMediaType = asset.type === 'video' ? 'video' : 'image';
        }

        updateCreatureSighting(index, {
          imageUrl: finalImageUrl,
          mediaType: finalMediaType,
          thumbnailUrl: finalThumbnailUrl,
        });
      }
    } catch (error) {
      console.error('ImagePicker Error: ', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const removeCreatureSighting = (index: number) => {
    const updatedSightings = [...creatureSightings];
    updatedSightings.splice(index, 1);
    onCreatureSightingsChange(updatedSightings);
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Creatures Spotted</Text>
      <Text style={styles.sectionDescription}>Log what you saw underwater. Add your own photos to each creature if you have them.</Text>

      <View style={styles.container}>
        {/* Add Creature Button */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.addButtonText}>+ Add Creatures</Text>
        </TouchableOpacity>

        {/* Creature Sightings List */}
        {creatureSightings.map((sighting, index) => {
          const creature = sighting.creatureId ? creaturesById[sighting.creatureId] : null;
          return (
            <View key={index} style={styles.sightingItem}>
              <View style={styles.sightingHeader}>
                <Text style={styles.creatureName}>
                  {creature?.name || 'Unknown Creature'}
                </Text>
                <TouchableOpacity
                  onPress={() => removeCreatureSighting(index)}
                  style={styles.removeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Trash2 size={20} color={COLORS.ERROR} />
                </TouchableOpacity>
              </View>

              {/* Image Section */}
              <View style={styles.imageSection}>
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={() => selectImageForCreature(index)}
                >
                  {sighting.imageUrl ? (
                    <Image
                      source={{ uri: sighting.imageUrl }}
                      style={styles.selectedImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Camera size={24} color={COLORS.TEXT_TERTIARY} style={{ marginBottom: 4 }} />
                      <Text style={styles.imagePickerText}>Add Photo</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Notes Input */}
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes..."
                placeholderTextColor={COLORS.TEXT_TERTIARY}
                value={sighting.notes || ''}
                onChangeText={(text) => updateCreatureSighting(index, { notes: text })}
                multiline
                selectionColor={COLORS.PRIMARY}
              />
            </View>
          );
        })}
      </View>

      <UniversalCreaturePicker
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onAddCreatures={handleAddCreatures}
        catalog={catalog}
        initialSelectedCreatureIds={creatureSightings
          .map(s => s.creatureId)
          .filter((id): id is string => id !== null)
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  container: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  addButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  sightingItem: {
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
    marginBottom: DIMENSIONS.SPACE_MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_SECONDARY,
  },
  sightingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  creatureName: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  removeButton: {
    padding: 4,
  },
  imageSection: {
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  imagePicker: {
    height: 100,
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  imagePickerPlaceholder: {
    alignItems: 'center',
  },
  imagePickerText: {
    color: COLORS.TEXT_TERTIARY,
    fontSize: TYPOGRAPHY.SIZE_SM,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  notesInput: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_SM,
    padding: DIMENSIONS.SPACE_SM,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_SM,
    minHeight: 60,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
});

export default MultipleCreatureSelector;