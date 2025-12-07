import React, { useEffect, useState, useMemo } from 'react';
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
import OfflineImageHandler from '@/components/OfflineImageHandler';
import WikimediaImage from '@/components/WikimediaImage';
import { useSyncedData } from '@/hooks/useSyncedData';
import { fetchCreaturesForCategory, creatures$ } from '@/stores/syncedObservables'; // Import lazy sync helper
import { useSelector } from '@legendapp/state/react';
import { ROUTES, COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { Plus } from 'lucide-react-native';

interface Creature {
  id: string;
  name: string;
  scientific_name: string | null;
  image_url: string | null;
  points: number;
  category_id: string; // Added for filtering
}

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams();
  const [category, setCategory] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  
  const { categories, isLoading } = useSyncedData();

  const [isFetchingCreatures, setIsFetchingCreatures] = useState(true); // Start loading immediately
  
  // Derived creatures list - ensures reactivity when store updates via useSelector
  const creatures = useSelector(() => {
    const all = creatures$.get();
    if (!all || !id) return [];
    return Object.values(all).filter(
      (creature: any) => creature.category_id === id
    );
  });

  // Find current category
  useEffect(() => {
    if (categories && id) {
      const categoriesArray = Object.values(categories);
      const currentCategory = categoriesArray.find((cat: any) => cat.id === id);
      setCategory(currentCategory);
    }
  }, [categories, id]);

  // Lazy load creatures on mount
  useEffect(() => {
    let isMounted = true;
    const loadCreatures = async () => {
      if (id) {
        setIsFetchingCreatures(true);
        try {
          await fetchCreaturesForCategory(id as string);
        } catch (error) {
          console.error('Error fetching creatures:', error);
        } finally {
          if (isMounted) {
            setIsFetchingCreatures(false);
          }
        }
      }
    };
    
    loadCreatures();
    
    return () => { isMounted = false; };
  }, [id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (id) {
        await fetchCreaturesForCategory(id as string);
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    }
    setRefreshing(false);
  };

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
          <OfflineImageHandler
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

  // Show loading if categories are initializing OR if we are explicitly fetching creatures
  // But allow showing cached creatures immediately if we have them (optimistic UI), 
  // so maybe only block if creatures array is empty?
  // User asked for loading state, so let's show it if we have NO creatures and are fetching.
  const showLoading = (isLoading.categories) || (isFetchingCreatures && creatures.length === 0);

  if (showLoading) {
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

       {/* Fascination Header */}
       {category?.fascination && (
           <View style={styles.fascinationBox}>
               <Text style={styles.fascinationTitle}>Fascination</Text>
               <Text style={styles.fascinationBody}>{category.fascination}</Text>
           </View>
       )}

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
    padding: DIMENSIONS.PADDING_LG,
  },
  creatureCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_LG,
    marginBottom: DIMENSIONS.SPACE_LG,
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
    padding: DIMENSIONS.PADDING_LG,
    justifyContent: 'center',
  },
  creatureName: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  scientificName: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  pointsBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    borderRadius: DIMENSIONS.RADIUS_SM,
    paddingHorizontal: DIMENSIONS.PADDING_XS,
    paddingVertical: DIMENSIONS.PADDING_XS,
    alignSelf: 'flex-start',
  },
  pointsText: {
    color: COLORS.PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_SM,
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
    fontSize: TYPOGRAPHY.SIZE_LG,
  },


  fascinationBox: {
      marginHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
      marginTop: DIMENSIONS.SPACE_MD,
      padding: DIMENSIONS.SPACE_MD,
      backgroundColor: '#222',
      borderRadius: DIMENSIONS.RADIUS_MD,
      borderLeftWidth: 4,
      borderLeftColor: COLORS.SECONDARY,
  },
  fascinationTitle: {
      color: COLORS.SECONDARY,
      fontSize: TYPOGRAPHY.SIZE_SM,
      fontWeight: 'bold',
      marginBottom: 4,
  },
  fascinationBody: {
      color: '#eee',
      fontSize: TYPOGRAPHY.SIZE_MD,
      lineHeight: 20,
  },
});