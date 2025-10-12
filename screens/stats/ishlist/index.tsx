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
import { Heart, X } from 'lucide-react-native';
import { useSyncedData } from '@/hooks/useSyncedData';
import { Creature } from '@/types/database';
import ImageWithFallback from '@/components/ImageWithFallback';
import ScreenHeader from '@/components/ui/ScreenHeader';

interface WishlistCreature {
  creature: Creature;
  wishlistItem: any;
}

export default function WishlistScreen() {
  const [wishlistCreatures, setWishlistCreatures] = React.useState<WishlistCreature[]>([]);
  const insets = useSafeAreaInsets();
  
  const { creatures: allCreatures, wishlists: allWishlists, removeWishlistItem } = useSyncedData();

  // Load data whenever allCreatures or allWishlists change
  React.useEffect(() => {
    const loadData = () => {
      try {
        // Extract data from observables
        const creaturesArray = allCreatures ? Object.values(allCreatures) : [];
        const wishlistsArray = allWishlists ? Object.values(allWishlists) : [];

        if (creaturesArray.length > 0 && wishlistsArray.length > 0) {
          // Create wishlist creatures list
          const wishlistCreatures: WishlistCreature[] = wishlistsArray.map((wishlistItem: any) => {
            const creature = creaturesArray.find((c: any) => c.id === wishlistItem.creature_id);
            return creature ? { creature, wishlistItem } : null;
          }).filter(Boolean) as WishlistCreature[];

          setWishlistCreatures(wishlistCreatures);
        }
      } catch (error) {
        console.error('Error loading wishlist:', error);
      }
    };

    loadData();
  }, [allCreatures, allWishlists]); // Depend on the actual data objects

  const handleRemoveFromWishlist = async (wishlistId: string, creatureName: string) => {
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
              await removeWishlistItem(wishlistId);
              // The useEffect will automatically re-run when wishlists change
              // due to the observable subscription in useSyncedData
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

  const renderWishlistCreature = ({ item }: { item: WishlistCreature }) => {
    return (
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
          <Text style={styles.addedDate}>Added: {formatDate(item.wishlistItem.created_at)}</Text>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{item.creature.points} pts</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => handleRemoveFromWishlist(item.wishlistItem.id, item.creature.name)}
        >
          <X size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScreenHeader 
        title={`Wishlist (${wishlistCreatures.length})`} 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      <FlatList
        data={wishlistCreatures}
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
  listContainer: {
    paddingHorizontal: 20,
    // Reduce top padding to account for safe area insets and ScreenHeader padding
    paddingTop: 5,
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