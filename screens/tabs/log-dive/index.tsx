import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal, FlatList, Image, Alert, TouchableWithoutFeedback } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Picker } from '@react-native-picker/picker';
import { useCatalogStore } from '../../../stores/catalog/store/store';
import { useSightingsStore } from '../../../stores/sightings/store/store';
import { useDiveSitesStore } from '../../../stores/diveSites/store/store';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Database } from '../../../types/database';
import * as ImagePicker from 'expo-image-picker';
import ClusteredMapView from 'react-native-maps-super-cluster';

// Types
// CreatureEntry interface removed as we no longer need additional creature selection

interface FormData {
  diveSiteId: string | null;
  customDiveSiteName: string;
  date: Date;
  time: Date;
  diveType: string;
  depth: string;
  diveNotes: string;
  imageUrl: string;
  creatureId: string | null;
}

interface SelectedImage {
  uri: string;
  type: string;
  fileName: string;
}

// Type for dive site data used in clustering
interface ClusteredDiveSite {
  type: 'Feature';
  id: string;
  properties: {
    id: string;
    name: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
}

const LogDiveScreen = () => {
  const [formData, setFormData] = useState<FormData>({
    diveSiteId: null,
    customDiveSiteName: '',
    date: new Date(),
    time: new Date(),
    diveType: '',
    depth: '',
    diveNotes: '',
    imageUrl: '',
    creatureId: null,
  });

  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const mapRef = useRef<MapView>(null);
  const clusteredMapRef = useRef<any>(null);
  const categoryDropdownRef = useRef<View>(null);
  const diveTypeDropdownRef = useRef<View>(null);
  const creatureDropdownRef = useRef<View>(null);

  const [showDiveSiteSearch, setShowDiveSiteSearch] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDiveTypeDropdown, setShowDiveTypeDropdown] = useState(false);
  const [showCreatureDropdown, setShowCreatureDropdown] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [diveSiteSearchQuery, setDiveSiteSearchQuery] = useState('');


  const { catalog, fetchCatalog } = useCatalogStore();
  const { createSighting } = useSightingsStore();
  const { diveSites, fetchDiveSites } = useDiveSitesStore();

  // Fetch catalog data and dive sites on component mount
  React.useEffect(() => {
    fetchCatalog();
    fetchDiveSites();
  }, []);

  const handleDiveSiteSelect = (siteId: string) => {
    setFormData(prev => ({
      ...prev,
      diveSiteId: siteId,
      customDiveSiteName: '',
    }));
    setShowDiveSiteSearch(false);
    setDiveSiteSearchQuery(''); // Clear search query when selecting a site
    
    // Animate to the selected dive site
    setTimeout(() => {
      const selectedSite = diveSites?.find(site => site.id === siteId);
      if (selectedSite && selectedSite.latitude && selectedSite.longitude) {
        // Use the proper method for animating to region
        // When a specific dive site is selected, we'll be using the regular MapView
        if (mapRef.current && mapRef.current.animateToRegion) {
          mapRef.current.animateToRegion({
            latitude: selectedSite.latitude,
            longitude: selectedSite.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }, 1000);
        }
      }
    }, 100);
  };



  const handleSubmit = async () => {
    try {
      // Format time of day from the time picker
      const timeOfDay = formData.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Create sighting for the main creature only
      const sightingData = {
        dive_site_id: formData.diveSiteId,
        dive_type: formData.diveType || null,
        date: formData.date.toISOString().split('T')[0],
        dive_notes: formData.diveNotes || null,
        depth: formData.depth || null,
        creature_id: formData.creatureId || null, // Use the main creature ID
        image_url: formData.imageUrl || null,
        time_of_day: timeOfDay,
        creature_notes: null, // No creature notes for main creature selection
      };
      
      // Create the sighting
      const result = await createSighting(sightingData as any); // Cast to any to avoid TypeScript issues
      
      console.log('Dive log submitted successfully:', result);
      alert('Dive log submitted successfully!');
      
      // Reset form
      setFormData({
        diveSiteId: null,
        customDiveSiteName: '',
        date: new Date(),
        time: new Date(),
        diveType: '',
        depth: '',
        diveNotes: '',
        imageUrl: '',
        creatureId: null,
      });
      
      // Reset image selection
      setSelectedImage(null);
      setSelectedCategories([]); // Also reset category selections
    } catch (error) {
      console.error('Error submitting dive log:', error);
      alert('Error submitting dive log. Please try again.');
    }
  };

  // Filter and prioritize dive sites based on search query
  const filteredDiveSites = React.useMemo(() => {
    if (!diveSites) return [];
    
    if (!diveSiteSearchQuery) return diveSites;
    
    const query = diveSiteSearchQuery.toLowerCase();
    
    // Separate sites that start with the query and those that contain it
    const startsWithQuery: Database['public']['Tables']['dive_sites']['Row'][] = [];
    const containsQuery: Database['public']['Tables']['dive_sites']['Row'][] = [];
    
    diveSites.forEach(site => {
      const siteName = site.name.toLowerCase();
      if (siteName.startsWith(query)) {
        startsWithQuery.push(site);
      } else if (siteName.includes(query)) {
        containsQuery.push(site);
      }
    });
    
    // Return prioritized list (starts with query first, then contains query)
    return [...startsWithQuery, ...containsQuery];
  }, [diveSites, diveSiteSearchQuery]);

  // Render dive site item for the list
  const renderDiveSiteItem = ({ item }: { item: Database['public']['Tables']['dive_sites']['Row'] }) => (
    <TouchableOpacity 
      style={styles.diveSiteItem}
      onPress={() => handleDiveSiteSelect(item.id)}
    >
      <Text style={styles.diveSiteName}>{item.name}</Text>
      <Text style={styles.diveSiteLocation}>
        {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
      </Text>
    </TouchableOpacity>
  );

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
        setSelectedImage({
          uri: asset.uri,
          type: asset.type || '',
          fileName: asset.fileName || `image_${Date.now()}.jpg`,
        });
        
        // Update form data with the image URI
        setFormData(prev => ({
          ...prev,
          imageUrl: asset.uri || '',
        }));
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

  // Category selection is now handled by the Picker component
  // This function is no longer needed but kept for reference

  // Filter creatures based on selected categories
  const filteredCreatures = React.useMemo(() => {
    if (!catalog?.creatures) return [];
    if (selectedCategories.length === 0) return catalog.creatures;
    return catalog.creatures.filter(creature => 
      selectedCategories.includes(creature.category_id)
    );
  }, [catalog?.creatures, selectedCategories]);

  // Close dropdowns when clicking outside
  const closeDropdowns = () => {
    setShowCategoryDropdown(false);
    setShowDiveTypeDropdown(false);
    setShowCreatureDropdown(false);
  };

  // Handle clicks outside dropdowns
  const handleOutsideClick = () => {
    closeDropdowns();
  };

  return (
    <TouchableWithoutFeedback 
      onPress={() => {
        // Close all dropdowns when clicking outside
        setShowCategoryDropdown(false);
        setShowDiveTypeDropdown(false);
        setShowCreatureDropdown(false);
      }}
    >
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Record your dive detail and Creature spotted</Text>
        </View>

        <View style={styles.content}>
          {/* 1. Dive Site Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dive Site</Text>
            
            <TouchableOpacity 
              style={styles.diveSiteSelector}
              onPress={() => setShowDiveSiteSearch(true)}
            >
              <Text style={formData.diveSiteId ? styles.diveSiteSelectedText : styles.diveSitePlaceholderText}>
                {formData.diveSiteId 
                  ? diveSites?.find(site => site.id === formData.diveSiteId)?.name 
                  : "Select a dive site"}
              </Text>
            </TouchableOpacity>

            {/* Dive Site Search Modal */}
            <Modal
              visible={showDiveSiteSearch}
              animationType="slide"
              onRequestClose={() => setShowDiveSiteSearch(false)}
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Dive Site</Text>
                  <TouchableOpacity onPress={() => {
                    setShowDiveSiteSearch(false);
                    setDiveSiteSearchQuery('');
                  }}>
                    <Text style={styles.closeButton}>Close</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Search Input */}
                <View style={styles.searchContainer}>
                  <TextInput
                    style={styles.diveSiteSearchInput}
                    placeholder="Search dive sites..."
                    placeholderTextColor="#999"
                    value={diveSiteSearchQuery}
                    onChangeText={setDiveSiteSearchQuery}
                  />
                </View>
                
                <FlatList
                  data={filteredDiveSites}
                  keyExtractor={(item) => item.id}
                  renderItem={renderDiveSiteItem}
                  style={styles.diveSiteList}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No dive sites found</Text>
                    </View>
                  }
                />
              </View>
            </Modal>
          </View>

          {/* 2. Map Card */}
          <View style={styles.mapCard}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>Dive Site Location</Text>
            </View>
            
            <View style={styles.mapContainer}>
              {formData.diveSiteId ? (
                (() => {
                  const selectedSite = diveSites?.find(site => site.id === formData.diveSiteId);
                  if (selectedSite && selectedSite.latitude && selectedSite.longitude) {
                    return (
                      <MapView
                        ref={mapRef}
                        style={styles.map}
                        initialRegion={{
                          latitude: selectedSite.latitude,
                          longitude: selectedSite.longitude,
                          latitudeDelta: 0.0922,
                          longitudeDelta: 0.0421,
                        }}
                      >
                        <Marker
                          coordinate={{
                            latitude: selectedSite.latitude,
                            longitude: selectedSite.longitude,
                          }}
                          title={selectedSite.name}
                        />
                      </MapView>
                    );
                  } else {
                    return (
                      <View style={styles.mapPlaceholder}>
                        <Text style={styles.mapPlaceholderText}>
                          {selectedSite?.name ? `${selectedSite.name} (Location not available)` : "Location not available"}
                        </Text>
                      </View>
                    );
                  }
                })()
              ) : formData.customDiveSiteName ? (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapPlaceholderText}>
                    {formData.customDiveSiteName} (Custom location)
                  </Text>
                </View>
              ) : diveSites && diveSites.length > 0 ? (
                (() => {
                  // Prepare data for clustering - SuperCluster expects GeoJSON format
                  // Filter out sites without valid coordinates
                  const validSites = diveSites
                    .filter(site => site.latitude !== null && site.longitude !== null)
                    .map(site => ({
                      type: 'Feature',
                      id: site.id,
                      properties: {
                        id: site.id,
                        name: site.name,
                      },
                      geometry: {
                        type: 'Point',
                        coordinates: [site.longitude!, site.latitude!], // [longitude, latitude]
                      },
                    }));

                  if (validSites.length === 0) {
                    return (
                      <View style={styles.mapPlaceholder}>
                        <Text style={styles.mapPlaceholderText}>
                          No dive sites with valid locations available.
                        </Text>
                      </View>
                    );
                  }

                  // Calculate initial region
                  let minLat = validSites[0].geometry.coordinates[1];
                  let maxLat = validSites[0].geometry.coordinates[1];
                  let minLng = validSites[0].geometry.coordinates[0];
                  let maxLng = validSites[0].geometry.coordinates[0];

                  validSites.forEach(site => {
                    minLat = Math.min(minLat, site.geometry.coordinates[1]);
                    maxLat = Math.max(maxLat, site.geometry.coordinates[1]);
                    minLng = Math.min(minLng, site.geometry.coordinates[0]);
                    maxLng = Math.max(maxLng, site.geometry.coordinates[0]);
                  });

                  // Add padding
                  const latPadding = (maxLat - minLat) * 0.1;
                  const lngPadding = (maxLng - minLng) * 0.1;
                  
                  minLat -= latPadding;
                  maxLat += latPadding;
                  minLng -= lngPadding;
                  maxLng += lngPadding;

                  const initialRegion = {
                    latitude: (minLat + maxLat) / 2,
                    longitude: (minLng + maxLng) / 2,
                    latitudeDelta: maxLat - minLat,
                    longitudeDelta: maxLng - minLng,
                  };

                  // Render function for individual markers
                  const renderMarker = (data: any) => (
                    <Marker
                      key={data.properties.id}
                      coordinate={{
                        latitude: data.geometry.coordinates[1],
                        longitude: data.geometry.coordinates[0],
                      }}
                      title={data.properties.name}
                      pinColor="#007AFF"
                      onPress={() => handleDiveSiteSelect(data.properties.id)}
                    />
                  );

                  // Render function for clusters
                  const renderCluster = (cluster: any, onPress: () => void) => {
                    // Add safety checks for cluster data
                    const pointCount = cluster && cluster.properties && cluster.properties.point_count ? cluster.properties.point_count : 0;
                    const coordinate = cluster && cluster.geometry && cluster.geometry.coordinates ? {
                      latitude: cluster.geometry.coordinates[1],
                      longitude: cluster.geometry.coordinates[0],
                    } : {
                      latitude: 0,
                      longitude: 0,
                    };
                      
                    return (
                      <Marker 
                        coordinate={coordinate} 
                        onPress={onPress}
                      >
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: '#007AFF',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Text style={{
                            color: '#FFFFFF',
                            fontWeight: 'bold',
                          }}>
                            {pointCount}
                          </Text>
                        </View>
                      </Marker>
                    );
                  };

                  return (
                    <ClusteredMapView
                      ref={clusteredMapRef}
                      style={styles.map}
                      data={validSites}
                      initialRegion={initialRegion}
                      renderMarker={renderMarker}
                      renderCluster={renderCluster}
                      preserveClusterPressBehavior={false} // We'll handle cluster press behavior ourselves
                      clusteringEnabled={validSites.length > 5} // Only enable clustering if there are more than 5 sites
                      onClusterPress={(clusterId: string, children: any[]) => {
                        // When a cluster is pressed, show a selection dialog or zoom in
                        try {
                          if (clusteredMapRef.current && typeof clusteredMapRef.current.getClusteringEngine === 'function') {
                            const clusteringEngine = clusteredMapRef.current.getClusteringEngine();
                            const clusterChildren = clusteringEngine.getLeaves(clusterId, 100);
                              
                            if (clusterChildren && clusterChildren.length > 0) {
                              // If there's only one site in the cluster, select it directly
                              if (clusterChildren.length === 1) {
                                handleDiveSiteSelect(clusterChildren[0].properties.id);
                              } 
                              // If there are only a few sites (2-5), show selection dialog
                              else if (clusterChildren.length <= 5) {
                                const siteOptions = clusterChildren.map((child: any) => child.properties.name);
                                const siteIds = clusterChildren.map((child: any) => child.properties.id);
                                  
                                Alert.alert(
                                  `Select a Dive Site`,
                                  `There are ${clusterChildren.length} dive sites in this area. Please select one:`,
                                  [
                                    ...siteOptions.map((name: string, index: number) => ({
                                      text: name,
                                      onPress: () => handleDiveSiteSelect(siteIds[index]),
                                    })),
                                    {
                                      text: 'Cancel',
                                      style: 'cancel',
                                    },
                                  ]
                                );
                              }
                              // If there are many sites, zoom in
                              else {
                                // Zoom in by reducing the delta values
                                const currentRegion = {
                                  latitude: clusterChildren[0].geometry.coordinates[1],
                                  longitude: clusterChildren[0].geometry.coordinates[0],
                                  latitudeDelta: initialRegion.latitudeDelta * 0.5,
                                  longitudeDelta: initialRegion.longitudeDelta * 0.5,
                                };
                                // @ts-ignore - getMapRef exists on ClusteredMapView
                                if (clusteredMapRef.current.getMapRef && typeof clusteredMapRef.current.getMapRef === 'function') {
                                  clusteredMapRef.current.getMapRef().animateToRegion(currentRegion, 500);
                                }
                              }
                            }
                          }
                        } catch (error) {
                          console.warn('Error handling cluster press:', error);
                          // Fallback: just zoom in
                          if (clusteredMapRef.current && typeof clusteredMapRef.current.getMapRef === 'function') {
                            // @ts-ignore - getMapRef exists on ClusteredMapView
                            clusteredMapRef.current.getMapRef().animateToRegion(initialRegion, 500);
                          }
                        }
                      }}
                    />
                  );
                })()
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapPlaceholderText}>
                    No dive sites available. Select a dive site to view its location on the map.
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* 3. Manual Dive Site Input */}
          <View style={styles.section}>
            <Text style={styles.label}>Manual Dive Site (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter custom dive site name"
              placeholderTextColor="#999"
              value={formData.customDiveSiteName}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                customDiveSiteName: text,
                diveSiteId: null,
              }))}
            />
          </View>

          {/* 4. Date and Time */}
          <View style={styles.dateTimeContainer}>
            <View style={styles.dateContainer}>
              <Text style={styles.label}>Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={formData.date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      setFormData(prev => ({ ...prev, date: selectedDate }));
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.timeContainer}>
              <Text style={styles.label}>Time</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              
              {showTimePicker && (
                <DateTimePicker
                  value={formData.time}
                  mode="time"
                  display="default"
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    if (selectedTime) {
                      setFormData(prev => ({ ...prev, time: selectedTime }));
                    }
                  }}
                />
              )}
            </View>
          </View>

          {/* 5. Dive Type and Depth - Same Line */}
          <View style={styles.section}>
            <View style={styles.diveTypeDepthContainer}>
              <View style={[styles.diveTypeContainer, { flex: 2 }]}>
                <Text style={styles.label}>Dive Type</Text>
                <TouchableOpacity 
                  style={styles.pickerContainer}
                  onPress={() => {
                    setShowDiveTypeDropdown(!showDiveTypeDropdown);
                    // Close other dropdowns
                    setShowCategoryDropdown(false);
                    setShowCreatureDropdown(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.picker}>
                      {formData.diveType || 'Select dive type'}
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 18 }}>▼</Text>
                  </View>
                </TouchableOpacity>
                
                {/* Custom Dive Type Dropdown */}
                {showDiveTypeDropdown && (
                  <TouchableOpacity
                    style={[styles.dropdown, { backgroundColor: '#000' }]}
                    onPress={(e) => e.stopPropagation()} // Prevent closing when clicking inside dropdown
                  >
                    <ScrollView
                      style={{ maxHeight: 200 }}
                      nestedScrollEnabled={true}
                    >
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          setFormData(prev => ({ ...prev, diveType: '' }));
                          setShowDiveTypeDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: !formData.diveType ? '#007AFF' : '#fff' }]}>
                          Select dive type
                        </Text>
                      </TouchableOpacity>
                      {['recreational', 'technical', 'night', 'drift', 'wreck', 'cave'].map((type) => (
                        <TouchableOpacity
                          key={type}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setFormData(prev => ({ ...prev, diveType: type }));
                            setShowDiveTypeDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: formData.diveType === type ? '#007AFF' : '#fff' }]}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </TouchableOpacity>
                )}
              </View>

              <View style={[styles.depthContainer, { flex: 1 }]}>
                <Text style={styles.label}>Depth (m)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Depth"
                  placeholderTextColor="#999"
                  value={formData.depth}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, depth: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>

          {/* 8. Dive Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Dive Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your dive experience, conditions, observations..."
              placeholderTextColor="#999"
              value={formData.diveNotes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, diveNotes: text }))}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* 9. Image Selection */}
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
                  <Text style={styles.imagePickerText}>📷 Tap to select image from gallery</Text>
                  <Text style={styles.imagePickerSubtext}>Choose a photo of your dive</Text>
                </View>
              )}

            </TouchableOpacity>
            
            {selectedImage && (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => {
                  setSelectedImage(null);
                  setFormData(prev => ({
                    ...prev,
                    imageUrl: '',
                  }));
                }}
              >
                <Text style={styles.removeImageButtonText}>Remove Image</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 10. Creatures Spotted Section - Simplified */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Creature Spotted
            </Text>
            
            <View style={styles.creaturesContainer}>
              {/* Category Selection with Custom Dropdown */}
              <View style={styles.section}>
                <Text style={styles.label}>1. Select Category</Text>
                <TouchableOpacity 
                  style={styles.pickerContainer}
                  onPress={() => {
                    setShowCategoryDropdown(!showCategoryDropdown);
                    // Close other dropdowns
                    setShowDiveTypeDropdown(false);
                    setShowCreatureDropdown(false);
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.picker}>
                      {selectedCategories.length > 0 
                        ? catalog?.categories?.find(c => c.id === selectedCategories[0])?.name 
                        : 'Select a category'}
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 18 }}>▼</Text>
                  </View>
                </TouchableOpacity>
                
                {/* Custom Category Dropdown */}
                {showCategoryDropdown && (
                  <TouchableOpacity
                    style={[styles.dropdown, { backgroundColor: '#000' }]}
                    onPress={(e) => e.stopPropagation()} // Prevent closing when clicking inside dropdown
                  >
                    <ScrollView
                      style={{ maxHeight: 200 }}
                      nestedScrollEnabled={true}
                    >
                      <TouchableOpacity
                        style={styles.dropdownItem}
                        onPress={() => {
                          // Clear category selection and creature selection
                          setSelectedCategories([]);
                          setFormData(prev => ({ ...prev, creatureId: null }));
                          setShowCategoryDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, { color: selectedCategories.length === 0 ? '#007AFF' : '#fff' }]}>
                          Select a category
                        </Text>
                      </TouchableOpacity>
                      {catalog?.categories?.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            // Select only this category and clear any previous creature selection
                            setSelectedCategories([category.id]);
                            setFormData(prev => ({ ...prev, creatureId: null }));
                            setShowCategoryDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: selectedCategories.includes(category.id) ? '#007AFF' : '#fff' }]}>
                            {category.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </TouchableOpacity>
                )}
              </View>
              
              {/* Main Creature Spotted Picker - Only shown when a category is selected */}
              {selectedCategories.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.label}>2. Select Creature</Text>
                  <TouchableOpacity 
                    style={styles.pickerContainer}
                    onPress={() => setShowCreatureDropdown(!showCreatureDropdown)}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.picker}>
                        {formData.creatureId 
                          ? filteredCreatures.find(c => c.id === formData.creatureId)?.name 
                          : 'Select a creature'}
                      </Text>
                      <Text style={{ color: '#fff', fontSize: 18 }}>▼</Text>
                    </View>
                  </TouchableOpacity>
                    
                  {/* Custom Creature Dropdown */}
                  {showCreatureDropdown && (
                    <TouchableOpacity
                      style={[styles.dropdown, { backgroundColor: '#000' }]}
                      onPress={(e) => e.stopPropagation()} // Prevent closing when clicking inside dropdown
                    >
                      <ScrollView
                        style={{ maxHeight: 200 }}
                        nestedScrollEnabled={true}
                      >
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            setFormData(prev => ({ ...prev, creatureId: null }));
                            setShowCreatureDropdown(false);
                          }}
                        >
                          <Text style={[styles.dropdownItemText, { color: !formData.creatureId ? '#007AFF' : '#fff' }]}>
                            Select a creature
                          </Text>
                        </TouchableOpacity>
                        {filteredCreatures.map((creature) => (
                          <TouchableOpacity
                            key={creature.id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setFormData(prev => ({ ...prev, creatureId: creature.id }));
                              setShowCreatureDropdown(false);
                            }}
                          >
                            <Text style={[styles.dropdownItemText, { color: formData.creatureId === creature.id ? '#007AFF' : '#fff' }]}>
                              {creature.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>Log Dive</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  headerText: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  diveSiteSelector: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#1a1a1a',
  },
  diveSitePlaceholderText: {
    color: '#999',
  },
  diveSiteSelectedText: {
    color: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    color: '#007AFF',
    fontSize: 16,
  },
  searchContainer: {
    padding: 20,
    paddingTop: 10,
  },
  diveSiteSearchInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#1a1a1a',
    fontSize: 16,
    color: '#fff',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#999',
    fontSize: 16,
  },
  diveSiteList: {
    flex: 1,
  },
  diveSiteItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  diveSiteName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  diveSiteLocation: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  mapCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  mapPlaceholder: {
    backgroundColor: '#2a2a2a',
    height: 200,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    color: '#fff',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#1a1a1a',
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  generalSearchInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#1a1a1a',
    fontSize: 16,
    color: '#fff',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#1a1a1a',
    fontSize: 16,
    color: '#fff',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateContainer: {
    flex: 1,
    marginRight: 10,
  },
  timeContainer: {
    flex: 1,
    marginLeft: 10,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    backgroundColor: '#1a1a1a',
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#000',
    minHeight: 50,
    marginBottom: 15,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  picker: {
    height: 55,
    color: '#fff',
    fontSize: 16,
    backgroundColor: 'transparent',
    fontFamily: 'System',
    lineHeight: 55,
  },
  // Custom dropdown styles
  dropdown: {
    backgroundColor: '#000',
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
    // Ensure the dropdown can scroll properly
  },
  dropdownItem: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    minHeight: 50, // Ensure minimum touch target size
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#fff',
    flex: 1, // Allow text to take available space
  },

  // New styles for dive type and depth on same line
  diveTypeDepthContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  diveTypeContainer: {
    flex: 2,
    marginRight: 10,
  },
  depthContainer: {
    flex: 1,
    marginLeft: 10,
  },
  creaturesContainer: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 10,
    margin: 5,
  },
  categoryCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryCheckboxSelected: {
    backgroundColor: '#007AFF',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryName: {
    color: '#fff',
    fontSize: 14,
  },
  categoryItemSelected: {
    backgroundColor: '#007AFF',
  },
  categoryNameSelected: {
    color: '#fff',
  },
  creaturesList: {
    marginBottom: 15,
  },
  creatureCard: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
  },
  creatureCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  creatureInfo: {
    flex: 1,
  },
  creatureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  creatureCategory: {
    fontSize: 14,
    color: '#999',
  },
  creatureTitleSelected: {
    color: '#fff',
  },
  creatureCategorySelected: {
    color: '#999',
  },
  selectionIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  plus: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  creatureNoteCard: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  creatureNoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  creatureNoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  removeCreatureButton: {
    padding: 5,
  },
  removeCreatureText: {
    color: '#ff3b30',
    fontSize: 14,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerText: {
    color: '#999',
    fontSize: 16,
  },
  imagePickerSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 5,
  },
  imagePickerError: {
    color: '#ff3b30',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    alignItems: 'center',
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LogDiveScreen;
