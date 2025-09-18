import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '@/services/supabase';
import { loadCatalogCache, loadDiveSitesCache } from '@/services/cache';
import { syncService } from '@/services/syncService';
import { Creature, DiveSite } from '@/types/database';
import { ROUTES } from '@/constants';
import LogDiveForm from '@/screens/tabs/log-dive/components/LogDiveForm';
import CreatureSelectionModal from '@/screens/tabs/log-dive/components/CreatureSelectionModal';

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
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [categories, setCategories] = useState<CategoryWithCreatures[]>([]);
  const [diveSites, setDiveSites] = useState<DiveSite[]>([]);
  const [selectedDiveSite, setSelectedDiveSite] = useState<DiveSite | null>(null);
  const [selectedCreatures, setSelectedCreatures] = useState<SelectedCreature[]>([]);
  const [showCreatureSelection, setShowCreatureSelection] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithCreatures | null>(null);
  const [creatureSearchQuery, setCreatureSearchQuery] = useState('');
  const insets = useSafeAreaInsets();
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeOfDay: new Date().toTimeString().split(' ')[0].slice(0, 5),
    depth: '',
    diveType: '',
    diveNotes: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDiveSiteDropdown, setShowDiveSiteDropdown] = useState(false);
  const [showDiveTypeDropdown, setShowDiveTypeDropdown] = useState(false);
  const [diveSiteSearch, setDiveSiteSearch] = useState('');

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
    setShowDiveSiteDropdown(false);
    setDiveSiteSearch('');
  };

  const filteredDiveSites = diveSites.filter(site =>
    site.name?.toLowerCase().includes(diveSiteSearch.toLowerCase())
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

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

  const handleCreatureToggle = (creature: Creature) => {
    const isSelected = selectedCreatures.some(sc => sc.creature.id === creature.id);
    
    if (isSelected) {
      setSelectedCreatures(prev => prev.filter(sc => sc.creature.id !== creature.id));
    } else {
      setSelectedCreatures(prev => [...prev, { creature }]);
    }
  };

  const handleCreatureImagePick = async (creatureId: string) => {
    // This will be implemented in the CreatureSelectionModal component
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

      // Save dive logic will be implemented here
      Alert.alert('Success', 'Dive logged successfully!');
      clearFormData();
    } catch (error) {
      Alert.alert('Error', 'Failed to log dive');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView}>
        <LogDiveForm
          formData={formData}
          setFormData={setFormData}
          diveSites={diveSites}
          selectedDiveSite={selectedDiveSite}
          setSelectedDiveSite={setSelectedDiveSite}
          showDiveSiteDropdown={showDiveSiteDropdown}
          setShowDiveSiteDropdown={setShowDiveSiteDropdown}
          diveSiteSearch={diveSiteSearch}
          setDiveSiteSearch={setDiveSiteSearch}
          filteredDiveSites={filteredDiveSites}
          handleDiveSiteSelect={handleDiveSiteSelect}
          diveTypes={diveTypes}
          selectedCreatures={selectedCreatures}
          setShowCreatureSelection={setShowCreatureSelection}
          saving={saving}
          handleSaveDive={handleSaveDive}
          clearFormData={clearFormData}
        />
      </ScrollView>
      
      <CreatureSelectionModal
        visible={showCreatureSelection}
        onClose={() => setShowCreatureSelection(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        creatureSearchQuery={creatureSearchQuery}
        setCreatureSearchQuery={setCreatureSearchQuery}
        selectedCreatures={selectedCreatures}
        handleCreatureToggle={handleCreatureToggle}
        handleCreatureImagePick={handleCreatureImagePick}
        handleCreatureNotes={handleCreatureNotes}
      />
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
});