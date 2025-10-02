import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Search, Camera, X, Check } from 'lucide-react-native';
import { Creature } from '@/types/database';
import ImageWithFallback from '@/components/ImageWithFallback';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const creatureCardWidth = (width - 60) / 3;

interface SelectedCreature {
  creature: Creature;
  notes?: string;
  imageUri?: string;
}

interface CategoryWithCreatures {
  id: string;
  name: string;
  image_url: string | null;
  creatures: Creature[];
}

interface CreatureSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  categories: CategoryWithCreatures[];
  selectedCategory: CategoryWithCreatures | null;
  setSelectedCategory: (category: CategoryWithCreatures | null) => void;
  creatureSearchQuery: string;
  setCreatureSearchQuery: (query: string) => void;
  selectedCreatures: SelectedCreature[];
  handleCreatureToggle: (creature: Creature) => void;
  handleCreatureImagePick: (creatureId: string, imageUri: string) => void;
  handleCreatureNotes: (creatureId: string, notes: string) => void;
}

const CreatureSelectionModal: React.FC<CreatureSelectionModalProps> = ({
  visible,
  onClose,
  categories,
  selectedCategory,
  setSelectedCategory,
  creatureSearchQuery,
  setCreatureSearchQuery,
  selectedCreatures,
  handleCreatureToggle,
  handleCreatureImagePick,
  handleCreatureNotes,
}: {
  visible: CreatureSelectionModalProps['visible'],
  onClose: CreatureSelectionModalProps['onClose'],
  categories: CreatureSelectionModalProps['categories'],
  selectedCategory: CreatureSelectionModalProps['selectedCategory'],
  setSelectedCategory: CreatureSelectionModalProps['setSelectedCategory'],
  creatureSearchQuery: CreatureSelectionModalProps['creatureSearchQuery'],
  setCreatureSearchQuery: CreatureSelectionModalProps['setCreatureSearchQuery'],
  selectedCreatures: CreatureSelectionModalProps['selectedCreatures'],
  handleCreatureToggle: CreatureSelectionModalProps['handleCreatureToggle'],
  handleCreatureImagePick: CreatureSelectionModalProps['handleCreatureImagePick'],
  handleCreatureNotes: CreatureSelectionModalProps['handleCreatureNotes']
}) => {
  const [expandedCreature, setExpandedCreature] = React.useState<string | null>(null);
  const [creatureNotes, setCreatureNotes] = React.useState('');

  const filteredCreatures = selectedCategory
    ? selectedCategory.creatures.filter(creature =>
        creature.name.toLowerCase().includes(creatureSearchQuery.toLowerCase()) ||
        creature.scientific_name?.toLowerCase().includes(creatureSearchQuery.toLowerCase())
      )
    : categories.flatMap(category => category.creatures).filter(creature =>
        creature.name.toLowerCase().includes(creatureSearchQuery.toLowerCase()) ||
        creature.scientific_name?.toLowerCase().includes(creatureSearchQuery.toLowerCase())
      );

  const isCreatureSelected = (creatureId: string) => {
    return selectedCreatures.some((sc: SelectedCreature) => sc.creature.id === creatureId);
  };

  const getSelectedCreature = (creatureId: string) => {
    return selectedCreatures.find((sc: SelectedCreature) => sc.creature.id === creatureId);
  };

  const handleCreaturePress = (creature: Creature) => {
    const isSelected = isCreatureSelected(creature.id);
    if (isSelected) {
      setExpandedCreature(expandedCreature === creature.id ? null : creature.id);
      const selectedCreature = getSelectedCreature(creature.id);
      setCreatureNotes(selectedCreature?.notes || '');
    } else {
      handleCreatureToggle(creature);
    }
  };

  const handleSaveNotes = (creatureId: string) => {
    handleCreatureNotes(creatureId, creatureNotes);
    setExpandedCreature(null);
  };

  const handleImagePick = async (creatureId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        // In a real app, you would update the state here
        // TODO: Implement proper creature selection logic
        handleCreatureImagePick(creatureId, result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const renderCreature = ({ item }: { item: Creature }) => {
    const isSelected = isCreatureSelected(item.id);
    const selectedCreature = getSelectedCreature(item.id);
    const isExpanded = expandedCreature === item.id;

    return (
      <View style={styles.creatureContainer}>
        <TouchableOpacity
          style={[
            styles.creatureCard,
            isSelected && styles.selectedCreatureCard
          ]}
          onPress={() => handleCreaturePress(item)}
        >
          <ImageWithFallback
            uri={item.image_url}
            style={styles.creatureImage}
            containerStyle={styles.imageContainer}
          />
          {isSelected && (
            <View style={styles.checkmarkContainer}>
              <View style={styles.checkmarkBackground}>
                <Check size={16} color="#fff" />
              </View>
            </View>
          )}
          <Text style={styles.creatureName} numberOfLines={1}>
            {item.name}
          </Text>
          {selectedCreature?.imageUri && (
            <Camera size={16} color="#007AFF" style={styles.cameraIcon} />
          )}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes about this creature..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={creatureNotes}
                onChangeText={setCreatureNotes}
              />
            </View>
            <View style={styles.expandedActions}>
              <TouchableOpacity
                style={styles.photoButton}
                onPress={() => handleImagePick(item.id)}
              >
                <Camera size={20} color="#007AFF" />
                <Text style={styles.photoButtonText}>Add Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveNotesButton}
                onPress={() => handleSaveNotes(item.id)}
              >
                <Text style={styles.saveNotesText}>Save Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Creatures</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search creatures..."
            placeholderTextColor="#666"
            value={creatureSearchQuery}
            onChangeText={setCreatureSearchQuery}
          />
        </View>

        <View style={styles.categoriesContainer}>
          <TouchableOpacity
            style={[
              styles.categoryButton,
              !selectedCategory && styles.activeCategoryButton
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryText,
              !selectedCategory && styles.activeCategoryText
            ]}>
              All
            </Text>
          </TouchableOpacity>
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory?.id === category.id && styles.activeCategoryButton
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory?.id === category.id && styles.activeCategoryText
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredCreatures}
          keyExtractor={(item) => item.id}
          renderItem={renderCreature}
          numColumns={3}
          contentContainerStyle={styles.creaturesList}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <Text style={styles.selectedCount}>
            {selectedCreatures.length} selected
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeCategoryButton: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#fff',
  },
  creaturesList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  creatureContainer: {
    width: creatureCardWidth,
    marginRight: 10,
  },
  creatureCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 8,
    marginBottom: 8,
  },
  selectedCreatureCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  imageContainer: {
    width: '100%',
    height: 80,
    marginBottom: 8,
  },
  creatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  creatureName: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  checkmarkBackground: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  expandedContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    minHeight: 60,
  },
  expandedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  photoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveNotesButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveNotesText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  selectedCount: {
    fontSize: 16,
    color: '#fff',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreatureSelectionModal;