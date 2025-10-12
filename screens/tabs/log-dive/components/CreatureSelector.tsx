import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Dimensions } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Database } from '@/types/database';
import { ImageWithFallback } from '@/components';

interface CreatureSelectorProps {
  catalog: any;
  selectedCategories: string[];
  creatureId: string | null;
  onCategoryChange: (categories: string[]) => void;
  onCreatureChange: (creatureId: string | null) => void;
}

const { width } = Dimensions.get('window');
const modalItemWidth = (width - 48) / 2;

const CreatureSelector: React.FC<CreatureSelectorProps> = ({
  catalog,
  selectedCategories,
  creatureId,
  onCategoryChange,
  onCreatureChange,
}) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCreatureModal, setShowCreatureModal] = useState(false);

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

  const selectedCreature = creatureId 
    ? filteredCreatures.find((c: any) => c.id === creatureId)
    : null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Creature Spotted
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
              <Text style={{ color: COLORS.TEXT_TERTIARY, fontSize: 18 }}>▼</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Main Creature Spotted Picker - Only shown when a category is selected */}
        {selectedCategories.length > 0 && (
          <View style={styles.creatureSection}>
            <View style={styles.stepIndicator}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepTitle}>Select Creature</Text>
            </View>
            <TouchableOpacity 
              style={styles.pickerContainer}
              onPress={() => setShowCreatureModal(true)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.picker}>
                  {selectedCreature?.name || 'Select creature'}
                </Text>
                <Text style={{ color: COLORS.TEXT_TERTIARY, fontSize: 18 }}>▼</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalContainer}>
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
                onCreatureChange(null);
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
                  onCreatureChange(null);
                  setShowCategoryModal(false);
                }}
              >
                <View style={[styles.modalItemContent, selectedCategory?.id === category.id && styles.selectedModalItem]}>
                  <ImageWithFallback
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
        <View style={styles.modalContainer}>
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
                onCreatureChange(null);
                setShowCreatureModal(false);
              }}
            >
              <View style={[styles.modalItemContent, !selectedCreature && styles.selectedModalItem]}>
                <Text style={[styles.modalItemText, !selectedCreature && styles.selectedModalItemText]}>
                  No Creature
                </Text>
              </View>
            </TouchableOpacity>
            
            {filteredCreatures.map((creature: any) => (
              <TouchableOpacity
                key={creature.id}
                style={styles.modalItem}
                onPress={() => {
                  onCreatureChange(creature.id);
                  setShowCreatureModal(false);
                }}
              >
                <View style={[styles.modalItemContent, selectedCreature?.id === creature.id && styles.selectedModalItem]}>
                  <ImageWithFallback
                    uri={creature.image_url}
                    style={styles.modalItemImage}
                    containerStyle={styles.modalItemImageContainer}
                  />
                  <Text style={[styles.modalItemText, selectedCreature?.id === creature.id && styles.selectedModalItemText]}>
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

export default CreatureSelector;