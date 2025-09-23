import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Heart, X } from 'lucide-react-native';
import { useUserStore } from '@/stores/user';
import { useCatalogStore } from '@/stores/catalog';
import { useWishlistStore } from '@/stores/wishlist';
import { Creature } from '@/types/database';
import ImageWithFallback from '@/components/ImageWithFallback';

interface WishlistItem {
  creature: Creature;
  addedDate: string;
}

export default function WishlistScreen() {
  const [wishlistItems, setWishlistItems] = React.useState<WishlistItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const insets = useSafeAreaInsets();
  
  const { fetchUserData } = useUserStore();
  const { fetchCatalog } = useCatalogStore();
  const { removeFromWishlist } = useWishlistStore();

  const loadData = async () => {
    try {
      // Fetch catalog and user data from stores
      const catalog = await fetchCatalog();
      const userData = await fetchUserData();

      if (catalog && userData) {
        // Create a map of wishlist items with their added dates
        const wishlistMap = userData.wishlists.reduce((acc: Record<string, string>, wishlist) => {
          acc[wishlist.creature_id] = wishlist.created_at;
          return acc;
        }, {});

        // Get wishlist creatures with their added dates
        const wishlistItemsWithDates = catalog.creatures
          .filter(c => wishlistMap[c.id])
          .map(creature => ({
            creature,
            addedDate: wishlistMap[creature.id]
          }));
        
        setWishlistItems(wishlistItemsWithDates);
      }
    } catch (error) {
      console.error('Error loading wishlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleRemoveFromWishlist = async (creatureId: string, creatureName: string) => {
    Alert.alert(
      'Remove from Wishlist',
      `Remove ${creatureName} from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Find the wishlist item ID for this creature
              const userData = await fetchUserData();
              const wishlistItem = userData.wishlists.find(item => item.creature_id === creatureId);
              
              if (wishlistItem) {
                await removeFromWishlist(wishlistItem.id);
                // Refresh the list
                await loadData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to remove from wishlist');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderWishlistCreature = ({ item }: { item: WishlistItem }) => (
    <View style={styles.creatureCard}>
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
        <Text style={styles.addedDate}>Added: {formatDate(item.addedDate)}</Text>
        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{item.creature.points} pts</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveFromWishlist(item.creature.id, item.creature.name)}
      >
        <X size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
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
        <Text style={styles.title}>Wishlist ({wishlistItems.length})</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={wishlistItems}
        keyExtractor={(item) => item.creature.id}
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
    marginBottom: 4,
  },
  addedDate: {
    fontSize: 12,
    color: '#666',
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
  removeButton: {
    padding: 8,
    marginLeft: 8,
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