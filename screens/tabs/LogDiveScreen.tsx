import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Calendar, Clock, MapPin, Camera, Check, ChevronDown, Search } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Creature, DiveSite, CachedCatalog } from '@/types/database';
import { loadCatalogCache, loadDiveSitesCache } from '@/services/cache';
import { syncService } from '@/services/syncService';
import { supabase } from '@/services/supabase';
import ImageWithFallback from '@/components/ImageWithFallback';

const { width } = Dimensions.get('window');
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

const diveTypes = [
  'Shore',
  'Boat', 
  'Wreck',
  'Drift',
  'Cave',
  'Night',
  'Deep'
];

export default function LogDiveScreen() {
  const [creatures, setCreatures] = React.useState<Creature[]>([]);
  const [categories, setCategories] = React.useState<CategoryWithCreatures[]>([]);
  const [diveSites, setDiveSites] = React.useState<DiveSite[]>([]);
  const [selectedDiveSite, setSelectedDiveSite] = React.useState<DiveSite | null>(null);
  const [selectedCreatures, setSelectedCreatures] = React.useState<SelectedCreature[]>([]);
  const [showDiveTypeDropdown, setShowDiveTypeDropdown] = React.useState(false);
  const [showCreatureSelection, setShowCreatureSelection] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryWithCreatures | null>(null);
  const [creatureSearchQuery, setCreatureSearchQuery] = React.useState('');
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = React.useState({
    date: new Date().toISOString().split('T')[0],
    timeOfDay: new Date().toTimeString().split(' ')[0].slice(0, 5),
    depth: '',
    diveType: '',
    diveNotes: '',
  });
  
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showDiveSiteDropdown, setShowDiveSiteDropdown] = React.useState(false);
  const [diveSiteSearch, setDiveSiteSearch] = React.useState('');

  const clearFormData = () => {
    // Reset all form data to defaults
    setSelectedCreatures([]);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      timeOfDay: new Date().toTimeString().split(' ')[0].slice(0, 5),
      depth: '',
      diveType: '',
      diveNotes: '',
    });
    setSelectedDiveSite(null);
    setShowCreatureSelection(false);
    setSelectedCategory(null);
    setCreatureSearchQuery('');
    setShowDiveTypeDropdown(false);
    setShowDiveSiteDropdown(false);
    setDiveSiteSearch('');
  };

  const filteredDiveSites = diveSites.filter(site =>
    site.name?.toLowerCase().includes(diveSiteSearch.toLowerCase())
  );

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catalog, sites] = await Promise.all([
        loadCatalogCache(),
        loadDiveSitesCache()
      ]);

      if (catalog) {
        setCreatures(catalog.creatures);
        
        // Group creatures by category
        const categoriesWithCreatures = catalog.categories.map(category => ({
          ...category,
          creatures: catalog.creatures.filter(creature => creature.category_id === category.id)
        })).filter(category => category.creatures.length > 0);
        
        setCategories(categoriesWithCreatures);
      }

      if (sites) {
        setDiveSites(sites);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDiveSiteSelect = (site: DiveSite) => {
    setSelectedDiveSite(site);
    setShowDiveSiteDropdown(false);
    setDiveSiteSearch('');
  };

  const handleMapMarkerPress = (site: DiveSite) => {
    setSelectedDiveSite(site);
  };

  const handleCreatureToggle = (creature: Creature) => {
    const isSelected = selectedCreatures.some(sc => sc.creature.id === creature.id);
    
    if (isSelected) {
      setSelectedCreatures(prev => prev.filter(sc => sc.creature.id !== creature.id));
    } else {
      setSelectedCreatures(prev => [...prev, { creature }]);
    }
  };

  const handleCreatureImagePick = async (creatureId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setSelectedCreatures(prev => 
          prev.map(sc => 
            sc.creature.id === creatureId 
              ? { ...sc, imageUri: result.assets[0].uri }
              : sc
          )
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCreatureNotes = (creatureId: string, notes: string) => {
    setSelectedCreatures(prev => 
      prev.map(sc => 
        sc.creature.id === creatureId 
          ? { ...sc, notes }
          : sc
      )
    );
  };

  const handleSaveDive = async () => {
    if (selectedCreatures.length === 0) {
      Alert.alert('Error', 'Please select at least one creature');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please sign in to log dives');
        return;
      }

      // Create a sighting for each selected creature
      for (const selectedCreature of selectedCreatures) {
        const sighting = {
          user_id: user.id,
          creature_id: selectedCreature.creature.id,
          date: formData.date,
          time_of_day: formData.timeOfDay || null,
          depth: formData.depth || null,
          dive_type: formData.diveType || null,
          dive_site_id: selectedDiveSite?.id || null,
          dive_notes: formData.diveNotes || null,
          creature_notes: selectedCreature.notes || null,
          image_url: selectedCreature.imageUri || null,
        };

        await syncService.queueSighting(sighting);
      }
      
      Alert.alert(
        'Success',
        `Dive logged with ${selectedCreatures.length} creature sighting${selectedCreatures.length > 1 ? 's' : ''}! Data will sync when online.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Clear all form data and selections
              clearFormData();
              // Navigate to home screen - useFocusEffect will handle reloading
              router.replace('/(tabs)');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving dive:', error);
      Alert.alert('Error', 'Failed to log dive');
    } finally {
      setSaving(false);
    }
  };

  const filteredCreatures = selectedCategory 
    ? selectedCategory.creatures.filter(creature =>
        creature.name.toLowerCase().includes(creatureSearchQuery.toLowerCase()) ||
        (creature.scientific_name && creature.scientific_name.toLowerCase().includes(creatureSearchQuery.toLowerCase()))
      )
    : [];

  const renderMap = () => {
    // Maps are not available on web platform
    if (Platform.OS === 'web') {
      return (
        <View style={styles.mapPlaceholder}>
          <MapPin size={32} color="#666" />
          <Text style={styles.mapPlaceholderText}>
            {selectedDiveSite 
              ? `Selected: ${selectedDiveSite.name}`
              : 'Map view not available on web. Use the dropdown above to select a dive site.'
            }
          </Text>
        </View>
      );
    }

    // Filter sites that have valid coordinates
    const sitesWithCoords = diveSites.filter(site => 
      site.latitude && site.longitude && 
      !isNaN(site.latitude) && !isNaN(site.longitude)
    );

    if (sitesWithCoords.length === 0) {
      return (
        <View style={styles.mapPlaceholder}>
          <MapPin size={32} color="#666" />
          <Text style={styles.mapPlaceholderText}>
            {selectedDiveSite 
              ? `Selected: ${selectedDiveSite.name}`
              : 'No dive sites with coordinates available'
            }
          </Text>
        </View>
      );
    }

    // Dynamically import maps only on native platforms
    const { AppleMaps, GoogleMaps } = require('expo-maps');

    // Calculate center point from all dive sites
    const avgLat = sitesWithCoords.reduce((sum, site) => sum + (site.latitude || 0), 0) / sitesWithCoords.length;
    const avgLng = sitesWithCoords.reduce((sum, site) => sum + (site.longitude || 0), 0) / sitesWithCoords.length;

    const markers = sitesWithCoords.map(site => ({
      id: site.id,
      coordinates: {
        latitude: site.latitude!,
        longitude: site.longitude!
      },
      title: site.name || 'Dive Site',
      tintColor: selectedDiveSite?.id === site.id ? '#007AFF' : '#FF3B30'
    }));

    const MapComponent = Platform.OS === 'ios' ? AppleMaps.View : GoogleMaps.View;

    return (
      <View style={styles.mapContainer}>
        <MapComponent
          style={styles.map}
          cameraPosition={{
            coordinates: {
              latitude: avgLat,
              longitude: avgLng
            },
            zoom: 8
          }}
          markers={markers}
          onMarkerClick={(event: { id: string }) => {
            const site = sitesWithCoords.find(s => s.id === event.id);
            if (site) {
              handleMapMarkerPress(site);
            }
          }}
          properties={{
            isMyLocationEnabled: true,
            mapType: Platform.OS === 'ios' ? 'STANDARD' : 'NORMAL'
          }}
          uiSettings={{
            myLocationButtonEnabled: true,
            compassEnabled: true,
            scaleBarEnabled: true
          }}
        />
        {selectedDiveSite && (
          <View style={styles.selectedSiteOverlay}>
            <MapPin size={16} color="#007AFF" />
            <Text style={styles.selectedSiteText}>Selected: {selectedDiveSite.name}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategoryCard = ({ item }: { item: CategoryWithCreatures }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => setSelectedCategory(item)}
    >
      <ImageWithFallback
        uri={item.image_url}
        style={styles.categoryImage}
        containerStyle={styles.categoryImageContainer}
      />
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.categoryCount}>
          {item.creatures.length} species
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCreatureCard = ({ item }: { item: Creature }) => {
    const isSelected = selectedCreatures.some(sc => sc.creature.id === item.id);
    
    return (
      <TouchableOpacity
        style={[styles.creatureCard, isSelected && styles.selectedCreatureCard]}
        onPress={() => handleCreatureToggle(item)}
      >
        <ImageWithFallback
          uri={item.image_url}
          style={styles.creatureImage}
          containerStyle={styles.creatureImageContainer}
        />
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Check size={16} color="#fff" />
          </View>
        )}
        <View style={styles.creatureInfo}>
          <Text style={styles.creatureName} numberOfLines={2}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedCreature = (selectedCreature: SelectedCreature, index: number) => (
    <View key={selectedCreature.creature.id} style={styles.selectedCreatureItem}>
      <View style={styles.selectedCreatureHeader}>
        <ImageWithFallback
          uri={selectedCreature.creature.image_url}
          style={styles.selectedCreatureThumb}
          containerStyle={styles.selectedCreatureThumbContainer}
        />
        <View style={styles.selectedCreatureDetails}>
          <Text style={styles.selectedCreatureName}>{selectedCreature.creature.name}</Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleCreatureToggle(selectedCreature.creature)}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TextInput
        style={styles.creatureNotesInput}
        placeholder="Notes about this creature..."
        placeholderTextColor="#666"
        value={selectedCreature.notes || ''}
        onChangeText={(text) => handleCreatureNotes(selectedCreature.creature.id, text)}
        multiline
        numberOfLines={2}
      />
      
      <TouchableOpacity
        style={styles.addPhotoButton}
        onPress={() => handleCreatureImagePick(selectedCreature.creature.id)}
      >
        <Camera size={16} color="#007AFF" />
        <Text style={styles.addPhotoText}>
          {selectedCreature.imageUri ? 'Change Photo' : 'Add Photo'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Log a Dive</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Log a Dive</Text>
          <Text style={styles.subtitle}>Record your dive details and creatures spotted</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dive Site</Text>
          
          <TouchableOpacity
            style={styles.diveSiteSelector}
            onPress={() => setShowDiveSiteDropdown(!showDiveSiteDropdown)}
          >
            <Text style={[styles.diveSiteSelectorText, !selectedDiveSite && styles.placeholderText]}>
              {selectedDiveSite?.name || 'Select dive site...'}
            </Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
          
          {showDiveSiteDropdown && (
            <View style={styles.diveSiteDropdown}>
              <View style={styles.searchContainer}>
                <Search size={16} color="#666" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search dive sites..."
                  placeholderTextColor="#666"
                  value={diveSiteSearch}
                  onChangeText={setDiveSiteSearch}
                />
              </View>
              
              <ScrollView style={styles.diveSiteList} nestedScrollEnabled>
                {filteredDiveSites.map((site) => (
                  <TouchableOpacity
                    key={site.id}
                    style={styles.diveSiteItem}
                    onPress={() => {
                      handleDiveSiteSelect(site);
                      setShowDiveSiteDropdown(false);
                      setDiveSiteSearch('');
                    }}
                  >
                    <View style={styles.diveSiteItemContent}>
                      <MapPin size={16} color="#007AFF" />
                      <View style={styles.diveSiteItemText}>
                        <Text style={styles.diveSiteItemName}>{site.name}</Text>
                        {site.latitude && site.longitude && (
                          <Text style={styles.diveSiteItemCoords}>
                            {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                
                {filteredDiveSites.length === 0 && (
                  <View style={styles.noResultsContainer}>
                    <Text style={styles.noResultsText}>No dive sites found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          )}
          
          {renderMap()}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Dive Site (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Or enter custom dive site name..."
            placeholderTextColor="#666"
            value=""
            onChangeText={() => {}}
          />
        </View>

        <View style={styles.formRow}>
          <View style={styles.formColumn}>
            <Text style={styles.sectionTitle}>Date</Text>
            <View style={styles.inputWithIcon}>
              <Calendar size={20} color="#666" />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          <View style={styles.formColumn}>
            <Text style={styles.sectionTitle}>Time</Text>
            <View style={styles.inputWithIcon}>
              <Clock size={20} color="#666" />
              <TextInput
                style={[styles.input, styles.inputWithIconText]}
                value={formData.timeOfDay}
                onChangeText={(text) => setFormData({ ...formData, timeOfDay: text })}
                placeholder="HH:MM"
                placeholderTextColor="#666"
              />
            </View>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formColumn}>
            <Text style={styles.sectionTitle}>Dive Type</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDiveTypeDropdown(!showDiveTypeDropdown)}
            >
              <Text style={[styles.dropdownText, !formData.diveType && styles.placeholderText]}>
                {formData.diveType || 'Select dive type...'}
              </Text>
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>
            {showDiveTypeDropdown && (
              <View style={styles.dropdownMenu}>
                {diveTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setFormData({ ...formData, diveType: type });
                      setShowDiveTypeDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.formColumn}>
            <Text style={styles.sectionTitle}>Depth (m)</Text>
            <TextInput
              style={styles.input}
              placeholder="Depth in meters"
              placeholderTextColor="#666"
              value={formData.depth}
              onChangeText={(text) => setFormData({ ...formData, depth: text })}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dive Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="General notes about this dive..."
            placeholderTextColor="#666"
            value={formData.diveNotes}
            onChangeText={(text) => setFormData({ ...formData, diveNotes: text })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Creatures Spotted ({selectedCreatures.length})</Text>
            <TouchableOpacity
              style={styles.selectCreaturesButton}
              onPress={() => setShowCreatureSelection(!showCreatureSelection)}
            >
              <Text style={styles.selectCreaturesText}>
                {showCreatureSelection ? 'Hide Selection' : 'Select Creatures'}
              </Text>
            </TouchableOpacity>
          </View>

          {selectedCreatures.map((sc, index) => renderSelectedCreature(sc, index))}

          {showCreatureSelection && (
            <View style={styles.creatureSelection}>
              {!selectedCategory ? (
                <View>
                  <Text style={styles.selectionTitle}>Select a Category</Text>
                  <FlatList
                    data={categories}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCategoryCard}
                    numColumns={2}
                    contentContainerStyle={styles.categoryGrid}
                    columnWrapperStyle={styles.categoryRow}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                  />
                </View>
              ) : (
                <View>
                  <View style={styles.categoryHeader}>
                    <TouchableOpacity
                      style={styles.backToCategoriesButton}
                      onPress={() => {
                        setSelectedCategory(null);
                        setCreatureSearchQuery('');
                      }}
                    >
                      <Text style={styles.backToCategoriesText}>← Back to Categories</Text>
                    </TouchableOpacity>
                    <Text style={styles.selectedCategoryTitle}>{selectedCategory.name}</Text>
                  </View>
                  
                  <View style={styles.searchContainer}>
                    <Search size={16} color="#666" />
                    <TextInput
                      style={styles.creatureSearchInput}
                      placeholder="Search creatures..."
                      placeholderTextColor="#666"
                      value={creatureSearchQuery}
                      onChangeText={setCreatureSearchQuery}
                    />
                  </View>
                  
                  <FlatList
                    data={filteredCreatures}
                    keyExtractor={(item) => item.id}
                    renderItem={renderCreatureCard}
                    numColumns={3}
                    contentContainerStyle={styles.creatureGrid}
                    columnWrapperStyle={styles.creatureRow}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                  />
                  
                  {filteredCreatures.length === 0 && creatureSearchQuery && (
                    <View style={styles.noResultsContainer}>
                      <Text style={styles.noResultsText}>No creatures found matching "{creatureSearchQuery}"</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveDive}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving Dive...' : `Log Dive (${selectedCreatures.length} creatures)`}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 16,
  },
  formColumn: {
    flex: 1,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  selectedSiteOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedSiteText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  mapPlaceholder: {
    height: 250,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  mapPlaceholderText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  diveSiteSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  diveSiteSelectorText: {
    fontSize: 16,
    color: '#fff',
  },
  diveSiteDropdown: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 16,
    maxHeight: 300,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    padding: 0,
  },
  diveSiteList: {
    maxHeight: 200,
  },
  diveSiteItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  diveSiteItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diveSiteItemText: {
    flex: 1,
  },
  diveSiteItemName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  diveSiteItemCoords: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  noResultsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#666',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 12,
  },
  inputWithIconText: {
    backgroundColor: 'transparent',
    flex: 1,
    padding: 12,
  },
  dropdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#fff',
  },
  placeholderText: {
    color: '#666',
  },
  dropdownMenu: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectCreaturesButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectCreaturesText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCreatureItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedCreatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedCreatureThumbContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginRight: 12,
  },
  selectedCreatureThumb: {
    width: '100%',
    height: '100%',
  },
  selectedCreatureDetails: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCreatureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  removeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  creatureNotesInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
    textAlignVertical: 'top',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addPhotoText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  creatureSelection: {
    marginTop: 16,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryGrid: {
    paddingBottom: 16,
  },
  categoryRow: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: (width - 60) / 2,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  categoryImageContainer: {
    width: '100%',
    height: 100,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryInfo: {
    padding: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backToCategoriesButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 16,
  },
  backToCategoriesText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  creatureSearchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  creatureGrid: {
    paddingBottom: 16,
  },
  creatureRow: {
    justifyContent: 'space-between',
  },
  creatureCard: {
    width: creatureCardWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  creatureImageContainer: {
    width: '100%',
    height: creatureCardWidth,
  },
  creatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectedCreatureCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  creatureInfo: {
    padding: 8,
  },
  creatureName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});