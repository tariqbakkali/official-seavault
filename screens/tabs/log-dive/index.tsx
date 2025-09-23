import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Calendar, MapPin, Clock, Fish, Image as ImageIcon, X, Plus } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useDiveSitesStore } from '@/stores/diveSites';
import { useSightingsStore } from '@/stores/sightings';
import { useCatalogStore } from '@/stores/catalog';
import { useUserStore } from '@/stores/user';
import { ROUTES, COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import ImagePicker from '@/components/ImagePicker';
import { Database } from '@/types/database';
import ImageWithFallback from '@/components/ImageWithFallback';

// Conditional import for maps with error handling
let AppleMaps: any, GoogleMaps: any;
let mapsAvailable = false;
if (Platform.OS !== 'web') {
  try {
    const maps = require('expo-maps');
    AppleMaps = maps.AppleMaps;
    GoogleMaps = maps.GoogleMaps;
    mapsAvailable = true;
  } catch (error) {
    console.warn('ExpoMaps not available:', error);
    mapsAvailable = false;
  }
}

interface CreatureEntry {
  id: string;
  creatureId: string | null;
  notes: string;
  imageUri: string | null;
}

interface FormData {
  date: Date;
  diveSiteId: string | null;
  diveType: string;
  timeOfDay: string;
  depth: string;
  creatures: CreatureEntry[];
  diveNotes: string;
  imageUri: string | null;
}

export default function LogDiveScreen() {
  const [formData, setFormData] = useState<FormData>({
    date: new Date(),
    diveSiteId: null,
    diveType: '',
    timeOfDay: '',
    depth: '',
    creatures: [{
      id: Date.now().toString(),
      creatureId: null,
      notes: '',
      imageUri: null
    }],
    diveNotes: '',
    imageUri: null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [diveSites, setDiveSites] = useState<any[]>([]);
  const [creatures, setCreatures] = useState<any[]>([]);
  const insets = useSafeAreaInsets();
  
  const params = useLocalSearchParams();
  
  const { fetchDiveSites, getDiveSiteById } = useDiveSitesStore();
  const { createSighting } = useSightingsStore();
  const { getCreatures } = useCatalogStore();
  const { fetchUserData } = useUserStore();

  // Handle selected creature and dive site from modals
  useEffect(() => {
    if (params.selectedDiveSiteId) {
      setFormData(prev => ({
        ...prev,
        diveSiteId: params.selectedDiveSiteId as string
      }));
    }
  }, [params.selectedDiveSiteId]);

  // Handle creature selection from modal
  useEffect(() => {
    if (params.selectedCreatureId && params.creatureEntryId) {
      setFormData(prev => ({
        ...prev,
        creatures: prev.creatures.map(creature => 
          creature.id === params.creatureEntryId 
            ? { ...creature, creatureId: params.selectedCreatureId as string } 
            : creature
        )
      }));
    }
  }, [params.selectedCreatureId, params.creatureEntryId]);

  const loadData = async () => {
    try {
      const sites = await fetchDiveSites();
      const creaturesList = await getCreatures();
      setDiveSites(sites);
      setCreatures(creaturesList);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error during refresh:', error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({ ...formData, date: selectedDate });
    }
  };

  const handleImageSelect = (uri: string) => {
    setFormData({ ...formData, imageUri: uri });
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      if (!formData.diveSiteId) {
        Alert.alert('Error', 'Please select a dive site');
        return;
      }

      // Validate that at least one creature is selected
      const hasSelectedCreature = formData.creatures.some(c => c.creatureId);
      if (!hasSelectedCreature) {
        Alert.alert('Error', 'Please select at least one creature');
        return;
      }

      // Create sightings for each selected creature
      const results = await Promise.all(
        formData.creatures
          .filter(creature => creature.creatureId)
          .map(async (creature) => {
            const sightingData = {
              dive_site_id: formData.diveSiteId,
              creature_id: creature.creatureId,
              date: formData.date.toISOString().split('T')[0],
              dive_type: formData.diveType || null,
              time_of_day: formData.timeOfDay || null,
              depth: formData.depth || null,
              dive_notes: formData.diveNotes || null,
              creature_notes: creature.notes || null,
              image_url: creature.imageUri || null,
            };

            return createSighting(sightingData as any);
          })
      );
      
      // Check if all sightings were created successfully
      const allSuccessful = results.every(result => result);
      
      if (allSuccessful) {
        // Refresh user data to update stats
        await fetchUserData();
        
        Alert.alert(
          'Success',
          'Dive log created successfully!',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Error', 'Failed to create dive log. Please try again.');
      }
    } catch (error) {
      console.error('Error creating dive log:', error);
      Alert.alert('Error', 'Failed to create dive log. Please try again.');
    }
  };

  const selectedDiveSite = formData.diveSiteId 
    ? diveSites.find(site => site.id === formData.diveSiteId)
    : null;

  // Render map component
  const renderMap = () => {
    // Maps are not available on web platform or if expo-maps is not available
    if (Platform.OS === 'web' || !mapsAvailable) {
      return (
        <View style={styles.mapPlaceholder}>
          <MapPin size={32} color="#666" />
          <Text style={styles.mapPlaceholderText}>
            {selectedDiveSite 
              ? `Selected: ${selectedDiveSite.name}`
              : 'Map view not available. Use the dropdown above to select a dive site.'
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
          onMarkerClick={(event: any) => {
            const site = sitesWithCoords.find(s => s.id === event.id);
            if (site) {
              setFormData(prev => ({ ...prev, diveSiteId: site.id }));
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

  // Creature management functions
  const addCreatureEntry = () => {
    setFormData(prev => ({
      ...prev,
      creatures: [
        ...prev.creatures,
        {
          id: Date.now().toString(),
          creatureId: null,
          notes: '',
          imageUri: null
        }
      ]
    }));
  };

  const removeCreatureEntry = (id: string) => {
    if (formData.creatures.length <= 1) {
      Alert.alert('Error', 'You must have at least one creature entry');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      creatures: prev.creatures.filter(creature => creature.id !== id)
    }));
  };

  const updateCreatureEntry = (id: string, field: keyof CreatureEntry, value: any) => {
    setFormData(prev => ({
      ...prev,
      creatures: prev.creatures.map(creature => 
        creature.id === id ? { ...creature, [field]: value } : creature
      )
    }));
  };

  const selectCreatureForEntry = (entryId: string) => {
    router.push({
      pathname: '/modal/creature-picker',
      params: { creatureEntryId: entryId }
    } as any);
  };

  // Render a single creature entry
  const renderCreatureEntry = (entry: CreatureEntry) => {
    const selectedCreature = entry.creatureId
      ? creatures.find(creature => creature.id === entry.creatureId)
      : null;

    return (
      <View style={styles.creatureEntryContainer} key={entry.id}>
        <View style={styles.creatureEntryHeader}>
          <Text style={styles.inputLabel}>Creature</Text>
          {formData.creatures.length > 1 && (
            <TouchableOpacity 
              style={styles.removeCreatureButton}
              onPress={() => removeCreatureEntry(entry.id)}
            >
              <X size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.selectInput}
          onPress={() => selectCreatureForEntry(entry.id)}
        >
          {selectedCreature ? (
            <View style={styles.selectedCreatureRow}>
              <ImageWithFallback
                uri={selectedCreature.image_url}
                style={styles.selectedCreatureImage}
              />
              <Text style={styles.selectText}>{selectedCreature.name}</Text>
            </View>
          ) : (
            <Text style={styles.placeholderText}>Select a creature</Text>
          )}
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        {/* Creature Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Creature Notes</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            placeholder="Describe your creature encounter..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            value={entry.notes}
            onChangeText={(text) => updateCreatureEntry(entry.id, 'notes', text)}
          />
        </View>

        {/* Creature Photo */}
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Camera size={20} color="#666" />
            <Text style={styles.inputLabel}>Creature Photo</Text>
          </View>
          <ImagePicker onImageSelect={(uri) => updateCreatureEntry(entry.id, 'imageUri', uri)} />
          {entry.imageUri && (
            <View style={styles.imagePreview}>
              <ImageIcon size={24} color="#666" />
              <Text style={styles.imageText}>Image selected</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Log a Dive</Text>
            <Text style={styles.subtitle}>Record your underwater discoveries</Text>
          </View>

          {/* Map */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <MapPin size={20} color="#666" />
              <Text style={styles.inputLabel}>Dive Site Map</Text>
            </View>
            {renderMap()}
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Date */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Calendar size={20} color="#666" />
                <Text style={styles.inputLabel}>Date</Text>
              </View>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={formData.date}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            )}

            {/* Dive Site */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MapPin size={20} color="#666" />
                <Text style={styles.inputLabel}>Dive Site</Text>
              </View>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => router.push(ROUTES.MODAL.EXPLORE)}
              >
                {selectedDiveSite ? (
                  <Text style={styles.selectText}>{selectedDiveSite.name}</Text>
                ) : (
                  <Text style={styles.placeholderText}>Select a dive site</Text>
                )}
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Dive Type */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Fish size={20} color="#666" />
                <Text style={styles.inputLabel}>Dive Type</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Scuba, Snorkel, Freediving"
                placeholderTextColor="#666"
                value={formData.diveType}
                onChangeText={(text) => setFormData({ ...formData, diveType: text })}
              />
            </View>

            {/* Time of Day */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Clock size={20} color="#666" />
                <Text style={styles.inputLabel}>Time of Day</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., Morning, Afternoon, Evening"
                placeholderTextColor="#666"
                value={formData.timeOfDay}
                onChangeText={(text) => setFormData({ ...formData, timeOfDay: text })}
              />
            </View>

            {/* Depth */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <MapPin size={20} color="#666" />
                <Text style={styles.inputLabel}>Depth (meters)</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., 10-15m"
                placeholderTextColor="#666"
                value={formData.depth}
                onChangeText={(text) => setFormData({ ...formData, depth: text })}
                keyboardType="numeric"
              />
            </View>

            {/* Creatures Section */}
            <View style={styles.inputGroup}>
              <View style={styles.sectionHeader}>
                <View style={styles.inputLabelRow}>
                  <Fish size={20} color="#666" />
                  <Text style={styles.inputLabel}>Creatures</Text>
                </View>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={addCreatureEntry}
                >
                  <Plus size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
              
              {formData.creatures.map(renderCreatureEntry)}
            </View>

            {/* Dive Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dive Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your dive experience..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.diveNotes}
                onChangeText={(text) => setFormData({ ...formData, diveNotes: text })}
              />
            </View>

            {/* Overall Photo */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Camera size={20} color="#666" />
                <Text style={styles.inputLabel}>Dive Photo</Text>
              </View>
              <ImagePicker onImageSelect={handleImageSelect} />
              {formData.imageUri && (
                <View style={styles.imagePreview}>
                  <ImageIcon size={24} color="#666" />
                  <Text style={styles.imageText}>Image selected</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Log Dive</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
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
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  textInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 100,
  },
  dateInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectText: {
    fontSize: 16,
    color: '#fff',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  chevron: {
    fontSize: 24,
    color: '#666',
  },
  imagePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  imageText: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 20,
    backgroundColor: '#000',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatureEntryContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  creatureEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  removeCreatureButton: {
    padding: 4,
  },
  selectedCreatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectedCreatureImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});