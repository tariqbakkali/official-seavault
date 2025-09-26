import * as React from 'react';
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
import { Heart, Plus, Calendar, MapPin, Clock } from 'lucide-react-native';
import { Creature, Sighting, DiveSite } from '@/types/database';
import { supabase } from '@/services/supabase';
import ImageWithFallback from '@/components/ImageWithFallback';
import { formatDate, formatTime } from '@/utils/format';
import { useCatalogStore } from '@/stores/catalog';
import { useUserStore } from '@/stores/user';
import { useWishlistStore } from '@/stores/wishlist';
import { useSightingsStore } from '@/stores/sightings';
import ScreenHeader from '@/components/ui/ScreenHeader';

const { width } = Dimensions.get('window');

export default function CreatureDetailScreen() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  // State variables instead of Zustand store
  const [creature, setCreature] = React.useState<Creature | null>(null);
  const [sightings, setSightings] = React.useState<Sighting[]>([]);
  const [isWishlisted, setIsWishlisted] = React.useState(false);
  const [isSeen, setIsSeen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('about');
  const [loading, setLoading] = React.useState(true);
  // Add state for dive sites
  const [diveSites, setDiveSites] = React.useState<DiveSite[]>([]);
  
  // Use existing stores
  const { getCreatures } = useCatalogStore();
  const { fetchUserData } = useUserStore();
  const { toggleWishlistItem } = useWishlistStore();
  const { createSighting } = useSightingsStore();

  React.useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch creature data
      const allCreatures = await getCreatures();
      const creatureData = allCreatures.find((c: any) => c.id === id);
      setCreature(creatureData || null);

      // Fetch user data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Check if creature is wishlisted
        const { data: wishlistData, error: wishlistError } = await supabase
          .from('wishlists')
          .select('*')
          .eq('user_id', user.id)
          .eq('creature_id', id)
          .maybeSingle();
        
        if (!wishlistError) {
          setIsWishlisted(!!wishlistData);
        }

        // Fetch sightings for this creature
        const { data: sightingsData, error: sightingsError } = await supabase
          .from('sightings')
          .select('*')
          .eq('user_id', user.id)
          .eq('creature_id', id)
          .order('date', { ascending: false });
        
        if (!sightingsError) {
          const sightingsArray = sightingsData || [];
          setSightings(sightingsArray);
          setIsSeen(sightingsArray.length > 0);
          
          // Fetch dive sites for all sightings
          if (sightingsArray.length > 0) {
            const diveSiteIds = sightingsArray
              .map((sighting: any) => sighting.dive_site_id)
              .filter((id): id is string => id !== null);
            
            if (diveSiteIds.length > 0) {
              // Fetch dive sites
              const { data: diveSitesData, error: diveSitesError } = await supabase
                .from('dive_sites')
                .select('*')
                .in('id', diveSiteIds);
              
              if (!diveSitesError) {
                setDiveSites(diveSitesData || []);
              }
            }
          }
        }
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

      // Toggle wishlist item using the store function
      const result = await toggleWishlistItem(creature.id);
      setIsWishlisted(result);
      
      // Refresh user data to update stats
      await fetchUserData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update wishlist');
    }
  };

  const handleAddSighting = () => {
    if (creature) {
      // Navigate to log dive screen with creature and category pre-selected
      router.push({
        pathname: '/(tabs)/log-dive',
        params: { 
          selectedCategory: creature.category_id,
          selectedCreature: creature.id,
          source: 'creature'
        }
      });
    }
  };

  // Group sightings by dive site for better UI organization
  const groupSightingsByDiveSite = () => {
    const grouped: { 
      [key: string]: { 
        diveSite: DiveSite | null; 
        sightings: Sighting[] 
      } 
    } = {};
    
    sightings.forEach(sighting => {
      const diveSiteId = sighting.dive_site_id || 'unknown';
      const diveSite = diveSiteId !== 'unknown' 
        ? diveSites.find(site => site.id === diveSiteId) || null 
        : null;
      
      if (!grouped[diveSiteId]) {
        grouped[diveSiteId] = {
          diveSite,
          sightings: []
        };
      }
      
      grouped[diveSiteId].sightings.push(sighting);
    });
    
    return grouped;
  };

  const renderSighting = ({ item, index }: { item: Sighting; index: number }) => {
    // Find the dive site name for this sighting
    const diveSite = item.dive_site_id 
      ? diveSites.find(site => site.id === item.dive_site_id) 
      : null;
    
    return (
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
        
        <View style={styles.sightingDetailsContainer}>
          {diveSite && (
            <View style={styles.sightingDetailRow}>
              <MapPin size={16} color="#007AFF" />
              <View style={styles.sightingDetailContent}>
                <Text style={styles.sightingDetailLabel}>Dive Site</Text>
                <Text style={styles.sightingDetailValue}>{diveSite.name}</Text>
              </View>
            </View>
          )}
          
          {item.dive_type && (
            <View style={styles.sightingDetailRow}>
              <Text style={styles.sightingDetailLabel}>Dive Type</Text>
              <Text style={styles.sightingDetailValue}>{item.dive_type}</Text>
            </View>
          )}
          
          {item.depth && (
            <View style={styles.sightingDetailRow}>
              <Text style={styles.sightingDetailLabel}>Depth</Text>
              <Text style={styles.sightingDetailValue}>{item.depth}m</Text>
            </View>
          )}
        </View>
        
        {(item.creature_notes || item.dive_notes) && (
          <View style={styles.notesContainer}>
            {item.creature_notes && (
              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Creature Notes</Text>
                <Text style={styles.noteText}>{item.creature_notes}</Text>
              </View>
            )}
            
            {item.dive_notes && (
              <View style={styles.noteSection}>
                <Text style={styles.noteLabel}>Dive Notes</Text>
                <Text style={styles.noteText}>{item.dive_notes}</Text>
              </View>
            )}
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
  };

  // Render sightings grouped by dive site
  const renderSightingsByDiveSite = () => {
    const groupedSightings = groupSightingsByDiveSite();
    const diveSiteKeys = Object.keys(groupedSightings);
    
    return (
      <View style={styles.sightingsByDiveSiteContainer}>
        {diveSiteKeys.map((diveSiteId) => {
          const group = groupedSightings[diveSiteId];
          const diveSite = group.diveSite;
          
          return (
            <View key={diveSiteId} style={styles.diveSiteGroup}>
              {diveSite && (
                <View style={styles.diveSiteHeader}>
                  <MapPin size={18} color="#007AFF" />
                  <Text style={styles.diveSiteName}>{diveSite.name}</Text>
                  <View style={styles.sightingCountBadge}>
                    <Text style={styles.sightingCountText}>{group.sightings.length}</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.sightingsListContainer}>
                {group.sightings.map((sighting, index) => (
                  <View 
                    key={sighting.id} 
                    style={[
                      styles.sightingCardInGroup, 
                      index !== group.sightings.length - 1 && styles.sightingCardWithDivider
                    ]}
                  >
                    <View style={styles.sightingHeaderInGroup}>
                      <View style={styles.sightingDateInfoInGroup}>
                        <View style={styles.dateRow}>
                          <Calendar size={14} color="#007AFF" />
                          <Text style={styles.sightingDateInGroup}>{formatDate(sighting.date)}</Text>
                        </View>
                        {sighting.time_of_day && (
                          <View style={styles.dateRow}>
                            <Clock size={14} color="#666" />
                            <Text style={styles.sightingTimeInGroup}>{formatTime(sighting.time_of_day)}</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.sightingIndex}>
                        <Text style={styles.sightingIndexText}>#{group.sightings.length - index}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.sightingDetailsContainerInGroup}>
                      {sighting.dive_type && (
                        <View style={styles.sightingDetailRowInGroup}>
                          <Text style={styles.sightingDetailLabelInGroup}>Dive Type</Text>
                          <Text style={styles.sightingDetailValueInGroup}>{sighting.dive_type}</Text>
                        </View>
                      )}
                      
                      {sighting.depth && (
                        <View style={styles.sightingDetailRowInGroup}>
                          <Text style={styles.sightingDetailLabelInGroup}>Depth</Text>
                          <Text style={styles.sightingDetailValueInGroup}>{sighting.depth}m</Text>
                        </View>
                      )}
                    </View>
                    
                    {(sighting.creature_notes || sighting.dive_notes) && (
                      <View style={styles.notesContainerInGroup}>
                        {sighting.creature_notes && (
                          <View style={styles.noteSectionInGroup}>
                            <Text style={styles.noteLabelInGroup}>Creature Notes</Text>
                            <Text style={styles.noteTextInGroup}>{sighting.creature_notes}</Text>
                          </View>
                        )}
                        
                        {sighting.dive_notes && (
                          <View style={styles.noteSectionInGroup}>
                            <Text style={styles.noteLabelInGroup}>Dive Notes</Text>
                            <Text style={styles.noteTextInGroup}>{sighting.dive_notes}</Text>
                          </View>
                        )}
                      </View>
                    )}
                    
                    {sighting.image_url && (
                      <View style={styles.sightingImageContainerInGroup}>
                        <ImageWithFallback
                          uri={sighting.image_url}
                          style={styles.sightingImageInGroup}
                          containerStyle={styles.sightingImageWrapperInGroup}
                        />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  if (loading || !creature) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ScreenHeader 
          title="Creature Details"
          onBackPress={() => router.back()}
          showBackButton={true}
        />
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
        </View>

        <ScreenHeader 
          title={creature.name}
          onBackPress={() => router.back()}
          showBackButton={true}
        />

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
              ) : sightings.length === 1 ? (
                // For single sighting, use the original rendering
                <FlatList
                  data={sightings}
                  keyExtractor={(item) => item.id}
                  renderItem={renderSighting}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  contentContainerStyle={styles.sightingsList}
                />
              ) : (
                // For multiple sightings, use the grouped rendering
                <ScrollView showsVerticalScrollIndicator={false} style={styles.sightingsScrollView}>
                  {renderSightingsByDiveSite()}
                </ScrollView>
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  sightingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sightingNumber: {
    backgroundColor: '#007AFF',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sightingNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sightingDateInfo: {
    flex: 1,
    alignItems: 'flex-end',
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
  sightingDetailsContainer: {
    marginBottom: 12,
  },
  sightingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sightingDetailContent: {
    flex: 1,
  },
  sightingDetailLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sightingDetailValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  notesContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  noteSection: {
    marginBottom: 8,
  },
  noteSectionLast: {
    marginBottom: 0,
  },
  noteLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  sightingImageContainer: {
    marginTop: 8,
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
  
  // New styles for grouped sightings
  sightingsByDiveSiteContainer: {
    paddingBottom: 20,
  },
  diveSiteGroup: {
    marginBottom: 24,
  },
  diveSiteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  diveSiteName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
    flex: 1,
  },
  sightingCountBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sightingCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sightingsListContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  sightingCardInGroup: {
    padding: 16,
  },
  sightingCardWithDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sightingHeaderInGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sightingDateInfoInGroup: {
    flex: 1,
  },
  sightingDateInGroup: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  sightingTimeInGroup: {
    fontSize: 12,
    color: '#666',
  },
  sightingIndex: {
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sightingIndexText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sightingDetailsContainerInGroup: {
    marginBottom: 12,
  },
  sightingDetailRowInGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sightingDetailLabelInGroup: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sightingDetailValueInGroup: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  notesContainerInGroup: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  noteSectionInGroup: {
    marginBottom: 6,
  },
  noteSectionInGroupLast: {
    marginBottom: 0,
  },
  noteLabelInGroup: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  noteTextInGroup: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 16,
  },
  sightingImageContainerInGroup: {
    marginTop: 8,
  },
  sightingImageWrapperInGroup: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sightingImageInGroup: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  sightingsScrollView: {
    flex: 1,
  },
});
