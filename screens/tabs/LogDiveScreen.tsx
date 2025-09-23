import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar, Clock, MapPin, Waves, Fish, Image as ImageIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useDataStore } from '@/stores/data';
import { uploadImage } from '@/services/supabase';
import ImageWithFallback from '@/components/ImageWithFallback';
import { CatalogData, Creature, DiveSite } from '@/types/database';

export default function LogDiveScreen() {
  const [catalog, setCatalog] = React.useState<CatalogData | null>(null);
  const [diveSites, setDiveSites] = React.useState<DiveSite[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  // Use the new data store instead of dataService
  const { fetchCatalog, fetchDiveSites, createSighting } = useDataStore();

  const loadData = async () => {
    try {
      // Fetch data directly from the new store
      const catalogData = await fetchCatalog();
      const sites = await fetchDiveSites();
      
      setCatalog(catalogData);
      setDiveSites(sites);
    } catch (error) {
      console.error('Error loading log dive data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      setFormData(prev => ({ ...prev, time: `${hours}:${minutes}` }));
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    if (!formData.creatureId) {
      Alert.alert('Error', 'Please select a creature');
      return;
    }

    setSaving(true);
    try {
      // Upload image if selected
      let imageUrl: string | null = null;
      if (imageUri) {
        imageUrl = await uploadImage(imageUri, 'sightings', `sightings/${Date.now()}`);
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
      }

      // Create sighting data
      const sightingData = {
        creature_id: formData.creatureId,
        date: formData.date.toISOString().split('T')[0],
        time_of_day: formData.time || null,
        dive_type: formData.diveType || null,
        depth: formData.depth ? parseFloat(formData.depth) : null,
        creature_notes: formData.creatureNotes || null,
        dive_notes: formData.diveNotes || null,
        image_url: imageUrl,
        dive_site_id: useCurrentLocation ? null : formData.diveSiteId || null
      };

      // Create sighting using dataService
      const result = await dataService.createSighting(sightingData as any);
      
      if (!result) {
        throw new Error('Failed to create sighting');
      }

      Alert.alert('Success', 'Dive logged successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('Error logging dive:', error);
      Alert.alert('Error', error.message || 'Failed to log dive');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return 'Select time';
    return time;
  };

  const selectedCreature = formData.creatureId 
    ? creatures.find(c => c.id === formData.creatureId) 
    : null;

  const selectedDiveSite = formData.diveSiteId 
    ? diveSites.find(d => d.id === formData.diveSiteId) 
    : null;

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Log a Dive</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Date and Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <TouchableOpacity 
            style={styles.inputRow}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color="#666" />
            <Text style={styles.inputText}>{formatDate(formData.date)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.inputRow}
            onPress={() => setShowTimePicker(true)}
          >
            <Clock size={20} color="#666" />
            <Text style={styles.inputText}>{formatTime(formData.time)}</Text>
          </TouchableOpacity>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Use Current Location</Text>
            <Switch
              value={useCurrentLocation}
              onValueChange={setUseCurrentLocation}
              trackColor={{ false: '#333', true: '#007AFF' }}
              thumbColor={useCurrentLocation ? '#fff' : '#f4f3f4'}
            />
          </View>
          
          {!useCurrentLocation && (
            <TouchableOpacity 
              style={styles.inputRow}
              onPress={() => router.push('/(tabs)/log-dive/select-dive-site' as any)}
            >
              <MapPin size={20} color="#666" />
              <Text style={styles.inputText}>
                {selectedDiveSite ? selectedDiveSite.name : 'Select dive site'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Dive Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dive Details</Text>
          <View style={styles.inputContainer}>
            <Waves size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Dive type (e.g., Scuba, Snorkel)"
              placeholderTextColor="#666"
              value={formData.diveType}
              onChangeText={(text) => setFormData(prev => ({ ...prev, diveType: text }))}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Fish size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Depth (meters)"
              placeholderTextColor="#666"
              value={formData.depth}
              onChangeText={(text) => setFormData(prev => ({ ...prev, depth: text }))}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Creature Sighting */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creature Sighting</Text>
          <TouchableOpacity 
            style={styles.inputRow}
            onPress={() => router.push('/(tabs)/log-dive/select-creature' as any)}
          >
            <Fish size={20} color="#666" />
            <Text style={styles.inputText}>
              {selectedCreature ? selectedCreature.name : 'Select creature'}
            </Text>
          </TouchableOpacity>
          
          {selectedCreature && (
            <View style={styles.creaturePreview}>
              <ImageWithFallback
                uri={selectedCreature.image_url}
                style={styles.creatureImage}
                containerStyle={styles.creatureImageContainer}
              />
              <View style={styles.creatureInfo}>
                <Text style={styles.creatureName}>{selectedCreature.name}</Text>
                {selectedCreature.scientific_name && (
                  <Text style={styles.creatureScientificName}>
                    {selectedCreature.scientific_name}
                  </Text>
                )}
              </View>
            </View>
          )}
          
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Notes about this creature..."
              placeholderTextColor="#666"
              value={formData.creatureNotes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, creatureNotes: text }))}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Dive Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dive Notes</Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="General notes about your dive..."
              placeholderTextColor="#666"
              value={formData.diveNotes}
              onChangeText={(text) => setFormData(prev => ({ ...prev, diveNotes: text }))}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Photo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photo</Text>
          <TouchableOpacity 
            style={styles.photoButton}
            onPress={handlePickImage}
          >
            <ImageIcon size={20} color="#666" />
            <Text style={styles.photoButtonText}>Add Photo</Text>
          </TouchableOpacity>
          
          {imageUri && (
            <View style={styles.imagePreview}>
              <ImageWithFallback
                uri={imageUri}
                style={styles.selectedImage}
                containerStyle={styles.selectedImageContainer}
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <Text style={styles.removeImageText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          display="default"
          onChange={handleTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
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
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    color: '#fff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    color: '#fff',
    fontSize: 16,
  },
  creaturePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  creatureImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  creatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  creatureInfo: {
    flex: 1,
  },
  creatureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  creatureScientificName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  textAreaContainer: {
    backgroundColor: '#333',
    borderRadius: 12,
  },
  textArea: {
    minHeight: 80,
    color: '#fff',
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePreview: {
    alignItems: 'center',
    marginTop: 16,
  },
  selectedImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removeImageButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  removeImageText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});