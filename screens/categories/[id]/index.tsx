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
import { ImageWithFallback } from '@/components';
import WikimediaImage from '@/components/WikimediaImage';
import { useSyncedData } from '@/hooks/useSyncedData';
import { ROUTES, COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Plus } from 'lucide-react-native';

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
  
  const { categories, creatures: allCreatures, isLoading } = useSyncedData();

  const loadData = async () => {
    try {
      // Get all categories to find the current one
      const categoriesArray = categories ? Object.values(categories) : [];
      const currentCategory = categoriesArray.find((cat: any) => cat.id === id);
      setCategory(currentCategory);

      // Get creatures for this category
      if (id) {
        const creaturesArray = allCreatures ? Object.values(allCreatures) as any[] : [];
        const categoryCreatures = creaturesArray.filter(
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
    if (!isLoading.categories && !isLoading.creatures) {
      loadData();
    }
  }, [id, categories, allCreatures, isLoading.categories, isLoading.creatures]);

  const handleLogDive = () => {
    // Navigate to log dive screen with category pre-selected
    router.push({
      pathname: ROUTES.TABS.LOG_DIVE,
      params: { 
        selectedCategory: id as string,
        source: 'category'
      }
    });
  };

  const renderCreature = ({ item }: { item: Creature }) => (
    <TouchableOpacity
      style={styles.creatureCard}
      onPress={() => router.push(`/creatures/${item.id}`)}
    >
      <View style={styles.creatureImageContainer}>
        {item.image_url && (item.image_url.includes('wikimedia.org') || item.image_url.includes('wikipedia.org')) ? (
          <WikimediaImage
            uri={item.image_url}
            style={styles.creatureImage}
            fallbackColor="#333"
          />
        ) : (
          <ImageWithFallback
            uri={item.image_url}
            style={styles.creatureImage}
            fallbackColor="#333"
            showOfflineIndicator={true}
          />
        )}
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

  if (isLoading.categories || isLoading.creatures) {
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
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Loading creatures...</Text>
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
        title={category?.name || 'Unknown Category'} 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      {/* Log Dive Button */}
      <TouchableOpacity style={styles.logDiveButton} onPress={handleLogDive}>
        <Plus size={20} color={COLORS.TEXT_PRIMARY} />
        <Text style={styles.logDiveButtonText}>Log Dive</Text>
      </TouchableOpacity>

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
  logDiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    marginHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    marginVertical: DIMENSIONS.SPACE_MD,
    paddingVertical: DIMENSIONS.SPACE_MD,
    borderRadius: DIMENSIONS.RADIUS_MD,
  },
  logDiveButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    marginLeft: DIMENSIONS.SPACE_SM,
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
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});