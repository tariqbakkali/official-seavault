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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, Calendar, MapPin, Clock, Fish, Image as ImageIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useDiveSitesStore } from '@/stores/diveSites';
import { useSightingsStore } from '@/stores/sightings';
import { useCatalogStore } from '@/stores/catalog';
import { useUserStore } from '@/stores/user';
import { ROUTES, COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import ImagePicker from '@/components/ImagePicker';
import { Database } from '@/types/database';

interface FormData {
  date: Date;
  diveSiteId: string | null;
  diveType: string;
  timeOfDay: string;
  depth: string;
  creatureId: string | null;
  diveNotes: string;
  creatureNotes: string;
  imageUri: string | null;
}

export default function LogDiveScreen() {
  const [formData, setFormData] = useState<FormData>({
    date: new Date(),
    diveSiteId: null,
    diveType: '',
    timeOfDay: '',
    depth: '',
    creatureId: null,
    diveNotes: '',
    creatureNotes: '',
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
    if (params.selectedCreatureId) {
      setFormData(prev => ({
        ...prev,
        creatureId: params.selectedCreatureId as string
      }));
    }
    
    if (params.selectedDiveSiteId) {
      setFormData(prev => ({
        ...prev,
        diveSiteId: params.selectedDiveSiteId as string
      }));
    }
  }, [params.selectedCreatureId, params.selectedDiveSiteId]);

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

      if (!formData.creatureId) {
        Alert.alert('Error', 'Please select a creature');
        return;
      }

      // Create sighting
      const sightingData = {
        dive_site_id: formData.diveSiteId,
        creature_id: formData.creatureId,
        date: formData.date.toISOString().split('T')[0],
        dive_type: formData.diveType || null,
        time_of_day: formData.timeOfDay || null,
        depth: formData.depth || null,
        dive_notes: formData.diveNotes || null,
        creature_notes: formData.creatureNotes || null,
        image_url: formData.imageUri || null,
      };

      const result = await createSighting(sightingData as any);
      
      if (result) {
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

  const selectedCreature = formData.creatureId
    ? creatures.find(creature => creature.id === formData.creatureId)
    : null;

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

            {/* Creature */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Fish size={20} color="#666" />
                <Text style={styles.inputLabel}>Creature</Text>
              </View>
              <TouchableOpacity
                style={styles.selectInput}
                onPress={() => router.push('/modal/creature-picker' as any)}
              >
                {selectedCreature ? (
                  <Text style={styles.selectText}>{selectedCreature.name}</Text>
                ) : (
                  <Text style={styles.placeholderText}>Select a creature</Text>
                )}
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
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

            {/* Creature Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Creature Notes</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe your creature encounter..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.creatureNotes}
                onChangeText={(text) => setFormData({ ...formData, creatureNotes: text })}
              />
            </View>

            {/* Photo */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelRow}>
                <Camera size={20} color="#666" />
                <Text style={styles.inputLabel}>Photo</Text>
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
});