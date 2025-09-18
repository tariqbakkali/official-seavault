import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Heart, Plus, Calendar, MapPin, Clock } from 'lucide-react-native';
import { Creature, Sighting, CachedCatalog, CachedUserData } from '@/types/database';
import { loadCatalogCache, loadUserDataCache } from '@/services/cache';
import { syncService } from '@/services/syncService';
import { supabase } from '@/services/supabase';
import ImageWithFallback from '@/components/ImageWithFallback';

const { width } = Dimensions.get('window');

export default function CreatureDetailScreen() {
  const { id } = useLocalSearchParams();
  const [creature, setCreature] = useState<Creature | null>(null);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSeen, setIsSeen] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'sightings'>('about');
  const [loading, setLoading] = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [catalog, userData] = await Promise.all([
        loadCatalogCache(),
        loadUserDataCache()
      ]);

      if (catalog && userData) {
        const creatureData = catalog.creatures.find(c => c.id === id);
        setCreature(creatureData || null);

        const isInWishlist = userData.wishlists.some(w => w.creature_id === id);
        setIsWishlisted(isInWishlist);

        const creatureSightings = userData.sightings.filter(s => s.creature_id === id);
        const hasBeenSeen = creatureSightings.length > 0;
        setIsSeen(hasBeenSeen);
        
        // Sort sightings by date (most recent first)
        const sortedSightings = creatureSightings.sort((a, b) => b.date.localeCompare(a.date));
        setSightings(sortedSightings);
      }
    } catch (error) {
      console.error('Error loading creature:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!creature) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isWishlisted) {
        // Remove from wishlist
        const wishlistItem = { id: `${user.id}-${creature.id}`, user_id: user.id, creature_id: creature.id };
        await syncService.queueWishlistToggle(wishlistItem, false);
        setIsWishlisted(false);
      } else {
        // Add to wishlist
        const wishlistItem = {
          id: `${user.id}-${creature.id}`,
          user_id: user.id,
          creature_id: creature.id
        };
        await syncService.queueWishlistToggle(wishlistItem, true);
        setIsWishlisted(true);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  const handleAddSighting = () => {
    if (creature) {
      // Navigate to log dive screen instead
      router.push('/(tabs)/log-dive');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return null;
    return timeString.slice(0, 5); // HH:MM format
  };

  const renderSighting = ({ item, index }: { item: Sighting; index: number }) => (
    <View style={styles.sightingCard}>
      <View style={styles.sightingHeader}>
        <View style={styles.sightingNumber}>
          <Text style={styles.sightingNumberText}>#{sightings.length - index}</Text>
        </View>
        <View style={styles.sightingDateInfo}>
          <View style={styles.dateRow}>
            <Calendar size={16} color="#007AFF" />
            <Text style={styles.sightingDate}>{formatDate(item.date)}</Text>
          </View>
          {item.time_of_day && (
            <View style={styles.dateRow}>
              <Clock size={16} color="#666" />
              <Text style={styles.sightingTime}>{formatTime(item.time_of_day)}</Text>
            </View>
          )}
        </View>
      </View>
      
      {item.dive_site_id && (
        <View style={styles.sightingDetail}>
          <MapPin size={14} color="#666" />
          <Text style={styles.sightingDetailText}>Dive Site ID: {item.dive_site_id}</Text>
        </View>
      )}
      
      {item.dive_type && (
        <View style={styles.sightingDetail}>
          <Text style={styles.sightingDetailLabel}>Dive Type:</Text>
          <Text style={styles.sightingDetailText}>{item.dive_type}</Text>
        </View>
      )}
      
      {item.depth && (
        <View style={styles.sightingDetail}>
          <Text style={styles.sightingDetailLabel}>Depth:</Text>
          <Text style={styles.sightingDetailText}>{item.depth}m</Text>
        </View>
      )}
      
      {item.creature_notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Creature Notes:</Text>
          <Text style={styles.notesText}>{item.creature_notes}</Text>
        </View>
      )}
      
      {item.dive_notes && (
        <View style={styles.notesSection}>
          <Text style={styles.notesLabel}>Dive Notes:</Text>
          <Text style={styles.notesText}>{item.dive_notes}</Text>
        </View>
      )}
      
      {item.image_url && (
        <View style={styles.sightingImageContainer}>
          <ImageWithFallback
            uri={item.image_url}
            style={styles.sightingImage}
            containerStyle={styles.sightingImageWrapper}
          />
        </View>
      )}
    </View>
  );

  if (loading || !creature) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statsData = [
    { label: 'Length', value: creature.length },
    { label: 'Weight', value: creature.weight },
    { label: 'Diet', value: creature.diet },
    { label: 'Lifespan', value: creature.lifespan },
  ].filter(stat => stat.value && stat.value.trim());

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <ImageWithFallback
            uri={creature.image_url}
            style={styles.heroImage}
            containerStyle={styles.imageWrapper}
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.creatureName}>{creature.name}</Text>
            {creature.scientific_name && (
              <Text style={styles.scientificName}>{creature.scientific_name}</Text>
            )}
          </View>

          <View style={styles.badgeRow}>
            {creature.class && (
              <View style={[styles.badge, styles.classBadge]}>
                <Text style={styles.badgeText}>{creature.class}</Text>
              </View>
            )}
            {creature.points > 0 && (
              <View style={[styles.badge, styles.pointsBadge]}>
                <Text style={styles.badgeText}>{creature.points} pts</Text>
              </View>
            )}
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'about' && styles.activeTab]}
              onPress={() => setActiveTab('about')}
            >
              <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
                About
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'sightings' && styles.activeTab]}
              onPress={() => setActiveTab('sightings')}
            >
              <Text style={[styles.tabText, activeTab === 'sightings' && styles.activeTabText]}>
                Sightings ({sightings.length})
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'about' && (
            <View style={styles.tabContent}>
              {creature.description && creature.description.trim() && (
                <Text style={styles.description}>{creature.description}</Text>
              )}

              {statsData.length > 0 && (
                <View style={styles.statsContainer}>
                  {statsData.map((stat, index) => (
                    <View key={index} style={styles.statCard}>
                      <Text style={styles.statValue}>{stat.value}</Text>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              )}

              {creature.habitat && creature.habitat.trim() && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Habitat</Text>
                  <Text style={styles.infoText}>{creature.habitat}</Text>
                </View>
              )}

              {creature.depth_range && creature.depth_range.trim() && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Depth Range</Text>
                  <Text style={styles.infoText}>{creature.depth_range}</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'sightings' && (
            <View style={styles.tabContent}>
              {sightings.length === 0 ? (
                <View style={styles.noSightingsContainer}>
                  <Calendar size={48} color="#666" />
                  <Text style={styles.noSightingsTitle}>No sightings yet</Text>
                  <Text style={styles.noSightingsSubtitle}>
                    Log a dive to record your first sighting of this creature
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={sightings}
                  keyExtractor={(item) => item.id}
                  renderItem={renderSighting}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={styles.sightingsList}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.actionButton, styles.wishlistButton, isWishlisted && styles.wishlistActive]}
          onPress={handleWishlistToggle}
        >
          <Heart size={20} color={isWishlisted ? '#fff' : '#FF3B30'} fill={isWishlisted ? '#fff' : 'none'} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.addSightingButton]}
          onPress={handleAddSighting}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addSightingText}>Add Sighting</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    marginBottom: 16,
  },
  creatureName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  scientificName: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  classBadge: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  pointsBadge: {
    backgroundColor: '#007AFF',
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabContent: {
    minHeight: 200,
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    marginBottom: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  noSightingsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noSightingsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  noSightingsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  sightingsList: {
    paddingBottom: 20,
  },
  sightingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sightingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sightingNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sightingNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sightingDateInfo: {
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sightingDate: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  sightingTime: {
    fontSize: 14,
    color: '#666',
  },
  sightingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sightingDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  sightingDetailText: {
    fontSize: 14,
    color: '#ccc',
  },
  notesSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  sightingImageContainer: {
    marginTop: 12,
  },
  sightingImageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sightingImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bottomBar: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34,
    backgroundColor: '#000',
    gap: 12,
  },
  actionButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  wishlistButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#FF3B30',
    width: 56,
  },
  wishlistActive: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  addSightingButton: {
    backgroundColor: '#007AFF',
    flex: 1,
  },
  addSightingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});