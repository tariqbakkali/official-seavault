import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Calendar, Clock, MapPin, Camera, Check } from 'lucide-react-native';
import { DiveSite, Creature } from '@/types/database';
import { ImageWithFallback } from '@/components';

const { width } = Dimensions.get('window');
const creatureCardWidth = (width - 60) / 3;

interface SelectedCreature {
  creature: Creature;
  notes?: string;
  imageUri?: string;
}

interface DiveFormData {
  date: string;
  timeOfDay: string;
  depth: string;
  diveType: string;
  diveNotes: string;
}

interface LogDiveFormProps {
  formData: DiveFormData;
  setFormData: (data: DiveFormData) => void;
  diveSites: DiveSite[];
  selectedDiveSite: DiveSite | null;
  setSelectedDiveSite: (site: DiveSite | null) => void;
  showDiveSiteDropdown: boolean;
  setShowDiveSiteDropdown: (show: boolean) => void;
  diveSiteSearch: string;
  setDiveSiteSearch: (search: string) => void;
  filteredDiveSites: DiveSite[];
  handleDiveSiteSelect: (site: DiveSite) => void;
  diveTypes: string[];
  selectedCreatures: SelectedCreature[];
  setShowCreatureSelection: (show: boolean) => void;
  saving: boolean;
  handleSaveDive: () => void;
  clearFormData: () => void;
}

const LogDiveForm: React.FC<LogDiveFormProps> = ({
  formData,
  setFormData,
  diveSites,
  selectedDiveSite,
  setSelectedDiveSite,
  showDiveSiteDropdown,
  setShowDiveSiteDropdown,
  diveSiteSearch,
  setDiveSiteSearch,
  filteredDiveSites,
  handleDiveSiteSelect,
  diveTypes,
  selectedCreatures,
  setShowCreatureSelection,
  saving,
  handleSaveDive,
  clearFormData,
}: {
  formData: LogDiveFormProps['formData'],
  setFormData: LogDiveFormProps['setFormData'],
  diveSites: LogDiveFormProps['diveSites'],
  selectedDiveSite: LogDiveFormProps['selectedDiveSite'],
  setSelectedDiveSite: LogDiveFormProps['setSelectedDiveSite'],
  showDiveSiteDropdown: LogDiveFormProps['showDiveSiteDropdown'],
  setShowDiveSiteDropdown: LogDiveFormProps['setShowDiveSiteDropdown'],
  diveSiteSearch: LogDiveFormProps['diveSiteSearch'],
  setDiveSiteSearch: LogDiveFormProps['setDiveSiteSearch'],
  filteredDiveSites: LogDiveFormProps['filteredDiveSites'],
  handleDiveSiteSelect: LogDiveFormProps['handleDiveSiteSelect'],
  diveTypes: LogDiveFormProps['diveTypes'],
  selectedCreatures: LogDiveFormProps['selectedCreatures'],
  setShowCreatureSelection: LogDiveFormProps['setShowCreatureSelection'],
  saving: LogDiveFormProps['saving'],
  handleSaveDive: LogDiveFormProps['handleSaveDive'],
  clearFormData: LogDiveFormProps['clearFormData']
}) => {
  const [showDiveTypeDropdown, setShowDiveTypeDropdown] = React.useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Log a Dive</Text>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearFormData}
        >
          <Text style={styles.clearText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Dive Details</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => {}}
          >
            <Calendar size={20} color="#666" />
            <Text style={styles.dateText}>{formData.date}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Time of Day</Text>
          <TouchableOpacity 
            style={styles.timeInput}
            onPress={() => {}}
          >
            <Clock size={20} color="#666" />
            <Text style={styles.timeText}>{formData.timeOfDay}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dive Site</Text>
          <TouchableOpacity 
            style={styles.diveSiteInput}
            onPress={() => setShowDiveSiteDropdown(true)}
          >
            <MapPin size={20} color="#666" />
            <Text style={styles.diveSiteText}>
              {selectedDiveSite?.name || 'Select dive site'}
            </Text>
          </TouchableOpacity>
          
          {showDiveSiteDropdown && (
            <View style={styles.dropdown}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search dive sites..."
                placeholderTextColor="#666"
                value={diveSiteSearch}
                onChangeText={setDiveSiteSearch}
              />
              {filteredDiveSites.map((site: DiveSite) => (
                <TouchableOpacity
                  key={site.id}
                  style={styles.dropdownItem}
                  onPress={() => handleDiveSiteSelect(site)}
                >
                  <Text style={styles.dropdownItemText}>{site.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Depth (meters)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter depth"
            placeholderTextColor="#666"
            keyboardType="numeric"
            value={formData.depth}
            onChangeText={(text) => setFormData({...formData, depth: text})}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Dive Type</Text>
          <TouchableOpacity 
            style={styles.diveTypeInput}
            onPress={() => setShowDiveTypeDropdown(!showDiveTypeDropdown)}
          >
            <Text style={styles.diveTypeText}>
              {formData.diveType || 'Select dive type'}
            </Text>
          </TouchableOpacity>
          
          {showDiveTypeDropdown && (
            <View style={styles.dropdown}>
              {diveTypes.map((type: string) => (
                <TouchableOpacity
                  key={type}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setFormData({...formData, diveType: type});
                    setShowDiveTypeDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Creatures Spotted</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowCreatureSelection(true)}
          >
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        
        {selectedCreatures.length > 0 ? (
          <View style={styles.creaturesGrid}>
            {selectedCreatures.map((selectedCreature: SelectedCreature, index: number) => (
              <View key={index} style={styles.creatureCard}>
                <ImageWithFallback
                  uri={selectedCreature.creature.image_url}
                  style={styles.creatureImage}
                  containerStyle={styles.imageContainer}
                />
                <Text style={styles.creatureName} numberOfLines={1}>
                  {selectedCreature.creature.name}
                </Text>
                {selectedCreature.imageUri && (
                  <Camera size={16} color="#007AFF" style={styles.cameraIcon} />
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No creatures selected yet</Text>
          </View>
        )}
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Dive Notes</Text>
        <TextInput
          style={styles.textArea}
          placeholder="Add any notes about your dive..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={formData.diveNotes}
          onChangeText={(text) => setFormData({...formData, diveNotes: text})}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSaveDive}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? 'Saving...' : 'Save Dive'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  clearButton: {
    padding: 8,
  },
  clearText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#fff',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
  },
  timeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  timeText: {
    fontSize: 16,
    color: '#fff',
  },
  diveSiteInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  diveSiteText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  diveTypeInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  diveTypeText: {
    fontSize: 16,
    color: '#fff',
  },
  dropdown: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 200,
  },
  searchInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#fff',
    margin: 8,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 100,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  creaturesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  creatureCard: {
    width: creatureCardWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 8,
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
  cameraIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  emptyState: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 34,
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

export default LogDiveForm;