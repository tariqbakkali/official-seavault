import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Trophy, Calendar } from 'lucide-react-native';
import { Creature, Sighting, CachedCatalog, CachedUserData } from '@/types/database';
import { loadCatalogCache, loadUserDataCache } from '@/services/cache';
import ImageWithFallback from '@/components/ImageWithFallback';

const { width } = Dimensions.get('window');
const cardWidth = width - 40;

interface PointsEntry {
  creature: Creature;
  sighting: Sighting;
  points: number;
}

export default function PointsScreen() {
  const [pointsEntries, setPointsEntries] = useState<PointsEntry[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

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
        // Group sightings by creature to find first sightings
        const creatureGroups: Record<string, Sighting[]> = {};
        userData.sightings.forEach(sighting => {
          if (!creatureGroups[sighting.creature_id]) {
            creatureGroups[sighting.creature_id] = [];
          }
          creatureGroups[sighting.creature_id].push(sighting);
        });

        // Create points entries for first sightings only
        const entries: PointsEntry[] = [];
        let total = 0;

        Object.entries(creatureGroups).forEach(([creatureId, sightings]) => {
          const creature = catalog.creatures.find(c => c.id === creatureId);
          if (!creature) return;

          // Sort sightings by date to get the first one
          const sortedSightings = sightings.sort((a, b) => a.date.localeCompare(b.date));
          const firstSighting = sortedSightings[0];
          
          const points = creature.points || 50; // Default points if not set
          entries.push({
            creature,
            sighting: firstSighting,
            points
          });
          total += points;
        });

        // Sort by sighting date (most recent first)
        entries.sort((a, b) => b.sighting.date.localeCompare(a.sighting.date));

        setPointsEntries(entries);
        setTotalPoints(total);
      }
    } catch (error) {
      console.error('Error loading points data:', error);
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

  const renderPointsEntry = ({ item }: { item: PointsEntry }) => (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={() => router.push(`/creatures/${item.creature.id}`)}
    >
      <ImageWithFallback
        uri={item.creature.image_url}
        style={styles.creatureImage}
        containerStyle={styles.imageContainer}
      />
      <View style={styles.entryInfo}>
        <View style={styles.entryHeader}>
          <Text style={styles.creatureName}>{item.creature.name}</Text>
          <View style={styles.pointsBadge}>
            <Trophy size={12} color="#fff" />
            <Text style={styles.pointsText}>+{item.points}</Text>
          </View>
        </View>
        {item.creature.scientific_name && (
          <Text style={styles.scientificName}>{item.creature.scientific_name}</Text>
        )}
        <View style={styles.dateRow}>
          <Calendar size={14} color="#666" />
          <Text style={styles.sightingDate}>
            Earned: {formatDate(item.sighting.date)}
          </Text>
        </View>
        {item.creature.class && (
          <View style={styles.classBadge}>
            <Text style={styles.classText}>{item.creature.class}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Points ({totalPoints})</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.totalPointsCard}>
        <Trophy size={32} color="#FF9500" />
        <Text style={styles.totalPointsValue}>{totalPoints}</Text>
        <Text style={styles.totalPointsLabel}>Total Points Earned</Text>
        <Text style={styles.totalPointsSubtext}>
          From {pointsEntries.length} unique creature discoveries
        </Text>
      </View>

      {pointsEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Trophy size={48} color="#666" />
          <Text style={styles.emptyTitle}>No points earned yet</Text>
          <Text style={styles.emptySubtitle}>
            Discover creatures to start earning points
          </Text>
        </View>
      ) : (
        <FlatList
          data={pointsEntries}
          keyExtractor={(item) => item.sighting.id}
          renderItem={renderPointsEntry}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
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
  totalPointsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  totalPointsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF9500',
    marginTop: 8,
  },
  totalPointsLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  totalPointsSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  entryCard: {
    width: cardWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  imageContainer: {
    width: 80,
    height: 100,
  },
  creatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  entryInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  creatureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  pointsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  scientificName: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sightingDate: {
    fontSize: 12,
    color: '#666',
  },
  classBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classText: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
  },
});