import * as React from 'react';
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
import { Calendar } from 'lucide-react-native';
import { useSyncedData } from '@/hooks/useSyncedData';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { ImageWithFallback } from '@/components';
import { formatDate } from '@/utils/format';
import { DIMENSIONS } from '@/constants/dimensions';

// Calculate card width based on screen size
const cardWidth = DIMENSIONS.SCREEN_WIDTH - 40;

interface DiscoveredCreature {
  creature: any;
  firstSighting: any;
  totalSightings: number;
}

export default function DiscoveredScreen() {
  const [discoveredCreatures, setDiscoveredCreatures] = React.useState<DiscoveredCreature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  const { creatures: allCreatures, currentUserSightings } = useSyncedData();

  const loadData = React.useCallback(() => {
    try {
      setLoading(true);
      // Extract data from observables
      const creaturesArray = allCreatures ? Object.values(allCreatures).filter(
        (c: any) => c && typeof c === 'object' && c.id && typeof c.id === 'string'
      ) : [];
      
      const sightingsArray = currentUserSightings ? Object.values(currentUserSightings).filter(
        (s: any) => s && typeof s === 'object' && s.creature_id && typeof s.creature_id === 'string'
      ) : [];
      
      // Group sightings by creature
      const sightingsByCreature: Record<string, any[]> = {};
      sightingsArray.forEach((sighting: any) => {
        if (!sightingsByCreature[sighting.creature_id]) {
          sightingsByCreature[sighting.creature_id] = [];
        }
        sightingsByCreature[sighting.creature_id].push(sighting);
      });
      
      // Create discovered creatures list with first sighting and total count
      const discovered: DiscoveredCreature[] = Object.entries(sightingsByCreature)
        .map(([creatureId, sightings]) => {
          // Find the creature details
          const creature: any = creaturesArray.find((c: any) => c.id === creatureId);
          if (!creature) return null;
          
          // Sort sightings by date to find the first one
          const sortedSightings = [...sightings].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          
          return {
            creature,
            firstSighting: sortedSightings[0],
            totalSightings: sightings.length
          };
        })
        .filter((item): item is DiscoveredCreature => item !== null)
        .sort((a, b) => 
          new Date(b.firstSighting.date).getTime() - new Date(a.firstSighting.date).getTime()
        );
      
      setDiscoveredCreatures(discovered);
    } catch (error) {
      console.error('Error loading discovered creatures:', error);
    } finally {
      setLoading(false);
    }
  }, [allCreatures, currentUserSightings]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const renderDiscoveredCreature = ({ item }: { item: DiscoveredCreature }) => (
    <TouchableOpacity
      style={styles.creatureCard}
      onPress={() => router.push(`/creatures/${item.creature.id}`)}
    >
      <ImageWithFallback
        uri={item.creature.image_url}
        style={styles.creatureImage}
        containerStyle={styles.imageContainer}
        showOfflineIndicator={true}
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
      <View style={[styles.container, { 
        paddingTop: insets.top, 
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }]}>
        <ScreenHeader 
          title="Loading..." 
          onBackPress={() => router.back()}
          showBackButton={true}
        />
      </View>
    );
  }

  // Show empty state if no discovered creatures
  if (discoveredCreatures.length === 0) {
    return (
      <View style={[styles.container, { 
        paddingTop: insets.top, 
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }]}>
        <ScreenHeader 
          title="Discovered (0)" 
          onBackPress={() => router.back()}
          showBackButton={true}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No discoveries yet</Text>
          <Text style={styles.emptySubtext}>Start logging dives to discover marine life</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top, 
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <ScreenHeader 
        title={`Discovered (${discoveredCreatures.length})`} 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

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
  listContainer: {
    paddingHorizontal: 20,
    // Reduce top padding to account for safe area insets and ScreenHeader padding
    paddingTop: 5,
    paddingBottom: 100,
  },
  creatureCard: {
    width: cardWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    minHeight: 100, // Ensure minimum height
  },
  imageContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#3a3a3a', // Add background color
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  creatureInfo: {
    flex: 1,
    padding: 16,
  },
  creatureName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  sightingInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  firstSightingDate: {
    fontSize: 14,
    color: '#666',
  },
  totalSightings: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  pointsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
  },
  pointsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});