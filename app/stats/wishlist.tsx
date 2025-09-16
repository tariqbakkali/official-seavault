import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Heart, X } from 'lucide-react-native';
import { Creature, Wishlist, CachedCatalog, CachedUserData } from '@/types/database';
import { loadCatalogCache, loadUserDataCache } from '@/services/cache';
import { syncService } from '@/services/syncService';
import ImageWithFallback from '@/components/ImageWithFallback';

const { width } = Dimensions.get('window');
const cardWidth = width - 40;

interface WishlistCreature {
  creature: Creature;
  wishlistItem: Wishlist;
}

export default function WishlistScreen() {
  const [wishlistCreatures, setWishlistCreatures] = useState<WishlistCreature[]>([]);
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
        const wishlistWithCreatures: WishlistCreature[] = userData.wishlists.map(wishlistItem => {
          const creature = catalog.creatures.find(c => c.id === wishlistItem.creature_id);
          return creature ? { creature, wishlistItem } : null;
        }).filter(Boolean) as WishlistCreature[];

        // Sort by most recently added to wishlist
        wishlistWithCreatures.sort((a, b) => 
          b.wishlistItem.created_at.localeCompare(a.wishlistItem.created_at)
        );

        setWishlistCreatures(wishlistWithCreatures);
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (item: WishlistCreature) => {
    Alert.alert(
      'Remove from Wishlist',
      `Remove ${item.creature.name} from your wishlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await syncService.queueWishlistToggle(item.wishlistItem, false);
              // Remove from local state immediately
              setWishlistCreatures(prev => 
                prev.filter(wc => wc.wishlistItem.id !== item.wishlistItem.id)
              );
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

  const renderWishlistCreature = ({ item }: { item: WishlistCreature }) => (
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
        <View style={styles.creatureHeader}>
          <View style={styles.creatureDetails}>
            <Text style={styles.creatureName}>{item.creature.name}</Text>
            {item.creature.scientific_name && (
              <Text style={styles.scientificName}>{item.creature.scientific_name}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFromWishlist(item)}
          >
            <X size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
        <Text style={styles.addedDate}>
          Added: {formatDate(item.wishlistItem.created_at)}
        </Text>
        <View style={styles.bottomRow}>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>{item.creature.points} pts</Text>
          </View>
          <View style={styles.heartIcon}>
            <Heart size={16} color="#FF3B30" fill="#FF3B30" />
          </View>
        </View>
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
        <Text style={styles.title}>Wishlist ({wishlistCreatures.length})</Text>
        <View style={styles.placeholder} />
      </View>

      {wishlistCreatures.length === 0 ? (
        <View style={styles.emptyState}>
          <Heart size={48} color="#666" />
          <Text style={styles.emptyTitle}>No creatures in wishlist</Text>
          <Text style={styles.emptySubtitle}>
            Add creatures to your wishlist to keep track of what you want to see
          </Text>
        </View>
      ) : (
        <FlatList
          data={wishlistCreatures}
          keyExtractor={(item) => item.wishlistItem.id}
          renderItem={renderWishlistCreature}
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
    height: 120,
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
  creatureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  creatureDetails: {
    flex: 1,
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
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addedDate: {
    fontSize: 12,
    color: '#666',
    marginVertical: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: {
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
  heartIcon: {
    // Just for visual balance
  },
});