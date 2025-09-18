import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Calendar } from 'lucide-react-native';
import { Creature, Sighting, CachedCatalog, CachedUserData } from '@/types/database';
import { loadCatalogCache, loadUserDataCache } from '@/services/cache';
import ImageWithFallback from '@/components/ImageWithFallback';

const { width } = Dimensions.get('window');
const cardWidth = width - 40;

interface DiscoveredCreature {
  creature: Creature;
  firstSighting: Sighting;
  totalSightings: number;
}

export default function DiscoveredScreen() {
  const [discoveredCreatures, setDiscoveredCreatures] = useState<DiscoveredCreature[]>([]);
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catalog, userData] = await Promise.all([
        loadCatalogCache(),
        loadUserDataCache()
      ]);

      if (catalog && userData) {
        // Group sightings by creature
        const creatureGroups: Record<string, Sighting[]> = {};
        userData.sightings.forEach(sighting => {
          if (!creatureGroups[sighting.creature_id]) {
            creatureGroups[sighting.creature_id] = [];
          }
          creatureGroups[sighting.creature_id].push(sighting);
        });

        // Create discovered creatures list
        const discovered: DiscoveredCreature[] = Object.entries(creatureGroups).map(([creatureId, sightings]) => {
          const creature = catalog.creatures.find(c => c.id === creatureId);
          if (!creature) return null;

          // Sort sightings by date (oldest first) to get first sighting
          const sortedSightings = sightings.sort((a, b) => a.date.localeCompare(b.date));
          
          return {
            creature,
            firstSighting: sortedSightings[0],
            totalSightings: sightings.length
          };
        }).filter(Boolean) as DiscoveredCreature[];

        // Sort by first sighting date (most recent first)
        discovered.sort((a, b) => b.firstSighting.date.localeCompare(a.firstSighting.date));

        setDiscoveredCreatures(discovered);
      }
    } catch (error) {
      console.error('Error loading discovered creatures:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderDiscoveredCreature = ({ item }: { item: DiscoveredCreature }) => (
    <TouchableOpacity
      style={styles.creatureCard}
      onPress={() => router.push(`/creatures/${item.creature.id}`)}
    >
      <ImageWithFallback
        uri={item.creature.image_url}
        style={styles.creatureImage}
        containerStyle={styles.imageContainer}
      />
      <View style={styles.creatureInfo}>
        <Text style={styles.creatureName}>{item.creature.name}</Text>
        {item.creature.scientific_name && (
          <Text style={styles.scientificName}>{item.creature.scientific_name}</Text>
        )}
        <View style={styles.sightingInfo}>
          <View style={styles.dateRow}>
            <Calendar size={14} color="#666" />
            <Text style={styles.firstSightingDate}>
              First seen: {formatDate(item.firstSighting.date)}
            </Text>
          </View>
          <Text style={styles.totalSightings}>
            {item.totalSightings} sighting{item.totalSightings > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{item.creature.points} pts</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Discovered ({discoveredCreatures.length})</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={discoveredCreatures}
        keyExtractor={(item) => item.creature.id}
        renderItem={renderDiscoveredCreature}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  placeholder: {
    width: 40,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  creatureCard: {
    width: cardWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  imageContainer: {
    width: 100,
    height: 100,
  },
  creatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  creatureInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  creatureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  scientificName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  sightingInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  firstSightingDate: {
    fontSize: 12,
    color: '#666',
  },
  totalSightings: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  pointsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pointsText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
});