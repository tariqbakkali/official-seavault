import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions, TextInput, Image, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {  DIMENSIONS, TYPOGRAPHY } from '@/constants';
import OfflineImageHandler from '@/components/OfflineImageHandler';
import { COLORS } from '@/constants';

interface CreatureSighting {
  creatureId: string | null;
  notes: string | null;
  imageUrl: string | null;
}

interface MultipleCreatureSelectorProps {
  catalog: any;
  selectedCategories: string[];
  creatureSightings: CreatureSighting[];
  onCategoryChange: (categories: string[]) => void;
  onCreatureSightingsChange: (sightings: CreatureSighting[]) => void;
}

const { width } = Dimensions.get('window');
const modalItemWidth = (width - 48) / 2;

const MultipleCreatureSelector: React.FC<MultipleCreatureSelectorProps> = ({
  catalog,
  selectedCategories,
  creatureSightings,
  onCategoryChange,
  onCreatureSightingsChange,
}) => {
  const insets = useSafeAreaInsets();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreatureModal, setShowCreatureModal] = useState(false);
  const [currentEditingIndex, setCurrentEditingIndex] = useState<number | null>(null);

  // Filter creatures based on selected categories
  const filteredCreatures = React.useMemo(() => {
    if (!catalog?.creatures) return [];
    if (selectedCategories.length === 0) return catalog.creatures;
    return catalog.creatures.filter((creature: any) => 
      selectedCategories.includes(creature.category_id)
    );
  }, [catalog?.creatures, selectedCategories]);

  const selectedCategory = selectedCategories.length > 0 
    ? catalog?.categories?.find((c: any) => c.id === selectedCategories[0])
    : null;

  // Add a new empty creature sighting
  const addNewCreatureSighting = () => {
    onCreatureSightingsChange([
      ...creatureSightings,
      { creatureId: null, notes: null, imageUrl: null }
    ]);
  };

  // Update a specific creature sighting
  const updateCreatureSighting = (index: number, creatureId: string | null, notes: string | null = null, imageUrl: string | null = null) => {
    const updatedSightings = [...creatureSightings];
    // If imageUrl is not provided, keep the existing one
    const currentImageUrl = imageUrl !== null ? imageUrl : updatedSightings[index]?.imageUrl || null;
    updatedSightings[index] = { creatureId, notes, imageUrl: currentImageUrl };
    onCreatureSightingsChange(updatedSightings);
  };

  // Select image for a specific creature sighting
  const selectImageForCreature = async (index: number) => {
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
        updateCreatureSighting(index, creatureSightings[index].creatureId, creatureSightings[index].notes, asset.uri);
      } else if (result.canceled) {
        // User cancelled the picker
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

  // Remove image for a specific creature sighting
  const removeImageForCreature = (index: number) => {
    updateCreatureSighting(index, creatureSightings[index].creatureId, creatureSightings[index].notes, null);
  };

  // Remove a creature sighting
  const removeCreatureSighting = (index: number) => {
    const updatedSightings = [...creatureSightings];
    updatedSightings.splice(index, 1);
    onCreatureSightingsChange(updatedSightings);
  };

  // Get creature details by ID
  const getCreatureById = (creatureId: string | null) => {
    if (!creatureId) return null;
    return catalog?.creatures?.find((c: any) => c.id === creatureId) || null;
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Creatures Spotted
      </Text>
      
      <View style={styles.creaturesContainer}>
        {/* Category Selection with Modal */}
        <View style={styles.creatureSection}>
          <View style={styles.stepIndicator}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Select Category</Text>
          </View>
          <TouchableOpacity 
            style={styles.pickerContainer}
            onPress={() => setShowCategoryModal(true)}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.picker}>
                {selectedCategory?.name || 'Select category'}
              </Text>
              <Text style={{ color: COLORS.TEXT_TERTIARY, fontSize: TYPOGRAPHY.SIZE_XL }}>▼</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Add Creature Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={addNewCreatureSighting}
        >
          <Text style={styles.addButtonText}>+ Add Creature</Text>
        </TouchableOpacity>

        {/* Creature Sightings List */}
        {creatureSightings.map((sighting, index) => {
          const creature = getCreatureById(sighting.creatureId);
          return (
            <View key={index} style={styles.sightingItem}>
              <View style={styles.sightingHeader}>
                <Text style={styles.sightingNumber}>Creature {index + 1}</Text>
                {creatureSightings.length > 1 && (
                  <TouchableOpacity onPress={() => removeCreatureSighting(index)}>
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Creature Selection */}
              <View style={styles.creatureSection}>
                <View style={styles.stepIndicator}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepTitle}>Select Creature</Text>
                </View>
                <TouchableOpacity 
                  style={styles.pickerContainer}
                  onPress={() => {
                    setCurrentEditingIndex(index);
                    setShowCreatureModal(true);
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.picker}>
                      {creature?.name || 'Select creature'}
                    </Text>
                    <Text style={{ color: COLORS.TEXT_TERTIARY, fontSize: TYPOGRAPHY.SIZE_XL }}>▼</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              {/* Creature Image Picker */}
              <View style={styles.imageSection}>
                <Text style={styles.imageLabel}>Creature Photo (Optional)</Text>
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
                      <Text style={styles.imagePickerText}>📷</Text>
                      <Text style={styles.imagePickerText}>Tap to select image</Text>
                      <Text style={styles.imagePickerSubtext}>Choose a photo of this creature</Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                {sighting.imageUrl && (
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImageForCreature(index)}
                  >
                    <Text style={styles.removeImageButtonText}>Remove Image</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Notes Input */}
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes (optional)</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add any notes about this sighting..."
                  placeholderTextColor={COLORS.TEXT_TERTIARY}
                  value={sighting.notes || ''}
                  onChangeText={(text) => updateCreatureSighting(index, sighting.creatureId, text, sighting.imageUrl)}
                  multiline
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={[styles.modalContainer, { 
          paddingTop: insets.top, 
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right
        }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                onCategoryChange([]);
                setShowCategoryModal(false);
              }}
            >
              <View style={[styles.modalItemContent, !selectedCategory && styles.selectedModalItem]}>
                <Text style={[styles.modalItemText, !selectedCategory && styles.selectedModalItemText]}>
                  All Categories
                </Text>
              </View>
            </TouchableOpacity>
            
            {catalog?.categories?.map((category: any) => (
              <TouchableOpacity
                key={category.id}
                style={styles.modalItem}
                onPress={() => {
                  onCategoryChange([category.id]);
                  setShowCategoryModal(false);
                }}
              >
                <View style={[styles.modalItemContent, selectedCategory?.id === category.id && styles.selectedModalItem]}>
                  <OfflineImageHandler
                    uri={category.image_url}
                    style={styles.modalItemImage}
                    containerStyle={styles.modalItemImageContainer}
                  />
                  <Text style={[styles.modalItemText, selectedCategory?.id === category.id && styles.selectedModalItemText]}>
                    {category.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Creature Selection Modal */}
      <Modal
        visible={showCreatureModal && selectedCategories.length > 0}
        animationType="slide"
        onRequestClose={() => setShowCreatureModal(false)}
      >
        <View style={[styles.modalContainer, { 
          paddingTop: insets.top, 
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right
        }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Creature</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowCreatureModal(false)}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
            // Allow maps to handle gestures by not intercepting them
            onStartShouldSetResponderCapture={() => false}
            onMoveShouldSetResponderCapture={() => false}
            onResponderTerminationRequest={() => false}
          >
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                if (currentEditingIndex !== null) {
                  updateCreatureSighting(currentEditingIndex, null, creatureSightings[currentEditingIndex].notes, creatureSightings[currentEditingIndex].imageUrl);
                }
                setShowCreatureModal(false);
                setCurrentEditingIndex(null);
              }}
            >
              <View style={[styles.modalItemContent, !getCreatureById(creatureSightings[currentEditingIndex || 0]?.creatureId) && styles.selectedModalItem]}>
                <Text style={[styles.modalItemText, !getCreatureById(creatureSightings[currentEditingIndex || 0]?.creatureId) && styles.selectedModalItemText]}>
                  No Creature
                </Text>
              </View>
            </TouchableOpacity>
            
            {filteredCreatures.map((creature: any) => (
              <TouchableOpacity
                key={creature.id}
                style={styles.modalItem}
                onPress={() => {
                  if (currentEditingIndex !== null) {
                    updateCreatureSighting(currentEditingIndex, creature.id, creatureSightings[currentEditingIndex].notes, creatureSightings[currentEditingIndex].imageUrl);
                  }
                  setShowCreatureModal(false);
                  setCurrentEditingIndex(null);
                }}
              >
                <View style={[styles.modalItemContent, getCreatureById(creatureSightings[currentEditingIndex || 0]?.creatureId)?.id === creature.id && styles.selectedModalItem]}>
                  <OfflineImageHandler
                    uri={creature.image_url}
                    style={styles.modalItemImage}
                    containerStyle={styles.modalItemImageContainer}
                  />
                  <Text style={[styles.modalItemText, getCreatureById(creatureSightings[currentEditingIndex || 0]?.creatureId)?.id === creature.id && styles.selectedModalItemText]}>
                    {creature.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  creaturesContainer: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  creatureSection: {
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACE_SM,
  },
  stepNumberText: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    fontSize: TYPOGRAPHY.SIZE_SM,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    backgroundColor: COLORS.BACKGROUND,
    minHeight: DIMENSIONS.BUTTON_HEIGHT_MD,
    marginBottom: DIMENSIONS.SPACE_LG,
    justifyContent: 'center',
    paddingHorizontal: DIMENSIONS.SPACE_MD,
  },
  picker: {
    height: DIMENSIONS.BUTTON_HEIGHT_MD,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    backgroundColor: 'transparent',
    fontFamily: 'System',
    lineHeight: DIMENSIONS.BUTTON_HEIGHT_MD,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  addButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  sightingItem: {
    backgroundColor: COLORS.BACKGROUND,
    borderWidth: 1,
    borderColor: COLORS.BORDER_SECONDARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  sightingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  sightingNumber: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  removeText: {
    color: COLORS.ERROR,
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  notesSection: {
    marginTop: DIMENSIONS.SPACE_SM,
  },
  notesLabel: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    backgroundColor: COLORS.SURFACE,
    padding: DIMENSIONS.SPACE_MD,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imageSection: {
    marginTop: DIMENSIONS.SPACE_SM,
  },
  imageLabel: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    backgroundColor: COLORS.SURFACE,
    height: 150,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: DIMENSIONS.SPACE_LG,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: DIMENSIONS.SPACE_LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    padding: DIMENSIONS.SPACE_SM,
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  modalContent: {
    padding: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: DIMENSIONS.SPACE_XXL,
  },
  modalItem: {
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  selectedModalItem: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '20',
  },
  modalItemImageContainer: {
    width: 50,
    height: 50,
    borderRadius: DIMENSIONS.RADIUS_MD,
    overflow: 'hidden',
    marginRight: DIMENSIONS.SPACE_MD,
  },
  modalItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalItemText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
    flex: 1,
  },
  selectedModalItemText: {
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
});

export default MultipleCreatureSelector;