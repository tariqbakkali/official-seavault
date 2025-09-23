import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { ImageWithFallback } from '@/components';
import { useCatalogStore } from '@/stores/catalog';
import { ROUTES, COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

interface Creature {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string | null;
  points: number;
}

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const [category, setCategory] = useState<any>(null);
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  
  const { getCategories, getCreatures } = useCatalogStore();

  const loadData = async () => {
    try {
      // Get all categories to find the current one
      const categories = await getCategories();
      const currentCategory = categories.find((cat: any) => cat.id === id);
      setCategory(currentCategory);

      // Get creatures for this category
      if (id) {
        const allCreatures = await getCreatures();
        const categoryCreatures = allCreatures.filter(
          (creature: any) => creature.category_id === id
        );
        setCreatures(categoryCreatures);
      }
    } catch (error) {
      console.error('Error loading category data:', error);
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
  }, [id]);

  const renderCreature = ({ item }: { item: Creature }) => (
    <TouchableOpacity
      style={styles.creatureCard}
      onPress={() => router.push(`/creatures/${item.id}`)}
    >
      <View style={styles.creatureImageContainer}>
        <ImageWithFallback
          uri={item.image_url}
          style={styles.creatureImage}
          fallbackColor="#333"
        />
      </View>
      <View style={styles.creatureInfo}>
        <Text style={styles.creatureName}>{item.name}</Text>
        {item.scientific_name && (
          <Text style={styles.scientificName}>{item.scientific_name}</Text>
        )}
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{item.points} pts</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.categoryTitle}>{category?.name || 'Loading...'}</Text>
      </View>

      {/* Creatures List */}
      <FlatList
        data={creatures}
        renderItem={renderCreature}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No creatures found in this category</Text>
          </View>
        }
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  categoryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  creatureCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  creatureImageContainer: {
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
    padding: 16,
    justifyContent: 'center',
  },
  creatureName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  pointsBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pointsText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});