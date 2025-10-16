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
import { Heart, Plus, Calendar, MapPin, Clock, Trophy, ArrowLeft } from 'lucide-react-native';
import { Creature, Sighting, DiveSite } from '@/types/database';
import { supabase } from '@/services/supabase';
import OfflineImageHandler from '@/components/OfflineImageHandler';
import { formatDate, formatTime } from '@/utils/format';
import { useSyncedData } from '@/hooks/useSyncedData';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { toggleWishlistItem } from '@/stores/syncedObservables';
import { ROUTES, APP_CONFIG, DIMENSIONS, COLORS } from '@/constants';

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
  
  // Use updated observable-based store
  const { creatures, wishlists, allUsersSightings, diveSites: allDiveSites, profile, userAchievements: allUserAchievements } = useSyncedData();
  const userProfile = profile ? Object.values(profile)[0] : undefined;

  React.useEffect(() => {
    loadData();
  }, [id, creatures, allUsersSightings, allDiveSites, wishlists, userProfile]);

  // Watch for changes in wishlists to update the UI
  React.useEffect(() => {
    const userWishlists = wishlists || {};
    const wishlistEntries = Object.values(userWishlists);
    const isCreatureWishlisted = wishlistEntries.some((item: any) => 
      item && item.creature_id === id
    );
    setIsWishlisted(isCreatureWishlisted);
  }, [wishlists, id]);

  const loadData = React.useCallback(() => {
    try {
      setLoading(true);
      
      // Fetch creature data using the new observable-based approach
      const allCreaturesArray = creatures ? Object.values(creatures) : [];
      const creatureData: any = allCreaturesArray.find((c: any) => c.id === id);
      setCreature(creatureData || null);

      // Check if creature is wishlisted using the wishlists observable
      const userWishlists = wishlists || {};
      const wishlistEntries = Object.values(userWishlists);
      const isCreatureWishlisted = wishlistEntries.some((item: any) => 
        item && item.creature_id === id
      );
      setIsWishlisted(isCreatureWishlisted);

      // Fetch user data
      const userId = userProfile && typeof userProfile === 'object' && userProfile.hasOwnProperty('id') ? (userProfile as any).id : undefined;
      if (userId) {
        // Fetch sightings for this creature using the allUsersSightings observable
        const allSightingsArray = allUsersSightings ? Object.values(allUsersSightings) : [];
        const sightingsArray = allSightingsArray.filter((sighting: any) => 
          sighting && sighting.creature_id === id
        ) as Sighting[];
        setSightings(sightingsArray);
        setIsSeen(sightingsArray.length > 0);
        
        // Fetch dive sites for all sightings using the diveSites observable
        if (sightingsArray.length > 0) {
          const diveSiteIds = sightingsArray
            .map((sighting: any) => sighting.dive_site_id)
            .filter((id): id is string => id !== null && id !== undefined);
          
          if (diveSiteIds.length > 0) {
            // Fetch dive sites from the diveSites observable
            const allDiveSitesArray = allDiveSites ? Object.values(allDiveSites) : [];
            const diveSitesArray = allDiveSitesArray.filter((site: any) => 
              site && diveSiteIds.includes(site.id)
            ) as DiveSite[];
            setDiveSites(diveSitesArray);
          }
        }
      }
    } catch (error) {
      console.error('Error loading creature:', error);
    } finally {
      setLoading(false);
    }
  }, [id, creatures, allUsersSightings, allDiveSites, wishlists, userProfile]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleWishlistToggle = async () => {
    if (!creature) return;
    
    try {
      const userId = userProfile && typeof userProfile === 'object' && userProfile.hasOwnProperty('id') ? (userProfile as any).id : undefined;
      if (!userId) return;

      // Toggle wishlist item using the new toggleWishlistItem function
      // This function handles both adding and removing from wishlist
      const result = await toggleWishlistItem(creature.id);
      
      // Update local state to reflect the change
      // The result indicates whether the item was added (true) or removed (false)
      setIsWishlisted(result);
    } catch (error) {
      console.error('Error toggling wishlist:', error);
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
        
        {diveSite && (
          <View style={styles.diveSiteInfo}>
            <MapPin size={16} color="#666" />
            <Text style={styles.diveSiteName}>{diveSite.name}</Text>
          </View>
        )}
        
        {item.dive_type && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabelNew}>Dive Type:</Text>
            <Text style={styles.detailValueNew}>{item.dive_type}</Text>
          </View>
        )}
        
        {item.depth && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabelNew}>Depth:</Text>
            <Text style={styles.detailValueNew}>{item.depth}</Text>
          </View>
        )}
        
        {item.dive_notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Dive Notes</Text>
            <Text style={styles.notesText}>{item.dive_notes}</Text>
          </View>
        )}
        
        {item.creature_notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Creature Notes</Text>
            <Text style={styles.notesText}>{item.creature_notes}</Text>
          </View>
        )}
        
        {item.image_url && (
          <View style={styles.imageSection}>
            <OfflineImageHandler
              uri={item.image_url}
              style={styles.sightingImage}
              fallbackColor="#333"
              showOfflineIndicator={true}
            />
          </View>
        )}
      </View>
    );
  };

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

  if (!creature) {
    return (
      <View style={[styles.container, { 
        paddingTop: insets.top, 
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }]}>
        <ScreenHeader 
          title="Creature Not Found" 
          onBackPress={() => router.back()}
          showBackButton={true}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Creature not found</Text>
        </View>
      </View>
    );
  }

  const groupedSightings = groupSightingsByDiveSite();
  const unlockedAchievements = allUserAchievements ? Object.values(allUserAchievements).length : 0;

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top, 
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { top: insets.top + 10 }]}>
        <ArrowLeft size={DIMENSIONS.ICON_LG} color={COLORS.TEXT_PRIMARY} />
      </TouchableOpacity>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Creature Image */}
        <View style={styles.imageContainer}>
          <OfflineImageHandler
            uri={creature.image_url}
            style={styles.image}
            fallbackColor="#333"
            showOfflineIndicator={true}
          />
        </View>
        
        {/* Creature Info */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{creature.name}</Text>
          </View>
          
                    <View style={styles.scientificNameRow}>
          
                      {creature.scientific_name && (
          
                        <Text style={styles.scientificName}>{creature.scientific_name}</Text>
          
                      )}
          
                      <View style={styles.pointsBadge}>
          
                        <Text style={styles.pointsBadgeText}>{creature.points} PTS</Text>
          
                      </View>
          
                    </View>
        </View>
        
        {/* Tab Navigation */}
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
        
        {/* Tab Content */}
        {activeTab === 'about' ? (
          <View style={styles.tabContent}>
            {creature.description && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.sectionText}>{creature.description}</Text>
              </View>
            )}
            
            <View style={styles.detailsGrid}>
              {creature.habitat && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Habitat</Text>
                  <Text style={styles.detailValue}>{creature.habitat}</Text>
                </View>
              )}
              
              {creature.diet && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Diet</Text>
                  <Text style={styles.detailValue}>{creature.diet}</Text>
                </View>
              )}
              
              {creature.depth_range && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Depth Range</Text>
                  <Text style={styles.detailValue}>{creature.depth_range}</Text>
                </View>
              )}
              
              {creature.length && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Length</Text>
                  <Text style={styles.detailValue}>{creature.length}</Text>
                </View>
              )}
              
              {creature.weight && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Weight</Text>
                  <Text style={styles.detailValue}>{creature.weight}</Text>
                </View>
              )}
              
              {creature.lifespan && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Lifespan</Text>
                  <Text style={styles.detailValue}>{creature.lifespan}</Text>
                </View>
              )}
              
              {creature.class && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Class</Text>
                  <Text style={styles.detailValue}>{creature.class}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {sightings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No sightings recorded yet</Text>
                <Text style={styles.emptySubtext}>Be the first to spot this creature!</Text>
              </View>
            ) : (
              <FlatList
                data={sightings}
                keyExtractor={(item) => item.id}
                renderItem={renderSighting}
                contentContainerStyle={styles.sightingsList}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtonsContainer, { bottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[
            styles.wishlistButton,
            isWishlisted && styles.wishlistButtonActive,
          ]}
          onPress={handleWishlistToggle}
        >
          <Heart
            size={24}
            color={'#FF3B30'}
            fill={isWishlisted ? '#FF3B30' : 'none'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.logDiveButton}
          onPress={handleAddSighting}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Log a Dive</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: width * 0.6,
    backgroundColor: '#333',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 20,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  heartButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  heartButtonActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  scientificNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scientificName: {
    fontSize: 18,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
  pointsBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 10,
  },
  pointsBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  sightingsList: {
    paddingBottom: 20,
  },
  sightingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sightingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sightingNumber: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sightingNumberText: {
    color: '#fff',
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
  diveSiteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  diveSiteName: {
    fontSize: 14,
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabelNew: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 100,
  },
  detailValueNew: {
    fontSize: 14,
    color: '#ccc',
    flex: 1,
  },
  imageSection: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sightingImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#333',
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  notesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
  },
  actionButtonsContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    paddingTop: 10,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#000', 
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  wishlistButton: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistButtonActive: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  logDiveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});