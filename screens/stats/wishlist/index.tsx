import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { useDataStore } from '@/stores/data';
import { Creature } from '@/types/database';
import ImageWithFallback from '@/components/ImageWithFallback';

export default function WishlistScreen() {
  const [wishlistCreatures, setWishlistCreatures] = React.useState<Creature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch catalog and user data directly from Supabase
      const catalog = await dataService.fetchCatalog();
      const userData = await dataService.fetchUserData();

      if (catalog && userData) {
        // Get wishlist creatures
        const wishlistCreatureIds = new Set(userData.wishlists.map(w => w.creature_id));
        const wishlistItems = catalog.creatures.filter(c => wishlistCreatureIds.has(c.id));
        
        setWishlistCreatures(wishlistItems);
      }
    } catch (error) {
      console.error('Error loading wishlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderWishlistCreature = ({ item }: { item: Creature }) => (
    <TouchableOpacity
      style={styles.creatureCard}
      onPress={() => router.push(`/creatures/${item.id}`)}
    >
      <ImageWithFallback
        uri={item.image_url}
        style={styles.creatureImage}
        containerStyle={styles.imageContainer}
      />
      <View style={styles.creatureInfo}>
        <Text style={styles.creatureName}>{item.name}</Text>
        {item.scientific_name && (
          <Text style={styles.scientificName}>{item.scientific_name}</Text>
        )}
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{item.points} pts</Text>
        </View>
      </View>
      <Heart size={20} color="#FF3B30" fill="#FF3B30" />
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
        <Text style={styles.title}>Wishlist ({wishlistCreatures.length})</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={wishlistCreatures}
        keyExtractor={(item) => item.id}
        renderItem={renderWishlistCreature}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={48} color="#666" />
            <Text style={styles.emptyTitle}>No wishlist items</Text>
            <Text style={styles.emptySubtitle}>
              Add creatures to your wishlist to track them
            </Text>
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
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    alignItems: 'center',
    padding: 16,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
  },
  creatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  creatureInfo: {
    flex: 1,
    marginLeft: 16,
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
  pointsBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    paddingTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});