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
import { DIMENSIONS, TYPOGRAPHY } from '@/constants';
import {  COLORS } from '@/constants';

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
  const { creatures, wishlists, currentUserSightings, diveSites: allDiveSites, profile } = useSyncedData();
  const userProfile = profile ? Object.values(profile)[0] : undefined;

  React.useEffect(() => {
    loadData();
  }, [id, creatures, currentUserSightings, allDiveSites, wishlists, userProfile]);

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
        // Fetch sightings for this creature using the currentUserSightings observable
        // This observable is already filtered for the current user
        const userSightingsArray = currentUserSightings ? Object.values(currentUserSightings) : [];
        const sightingsArray = userSightingsArray.filter((sighting: any) => 
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
  }, [id, creatures, currentUserSightings, allDiveSites, wishlists, userProfile]);

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
    padding: DIMENSIONS.PADDING_LG,
    backgroundColor: '#1a1a1a',
    borderBottomLeftRadius: DIMENSIONS.RADIUS_LG,
    borderBottomRightRadius: DIMENSIONS.RADIUS_LG,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  name: {
    fontSize: TYPOGRAPHY.SIZE_TITLE,
    fontWeight: 'bold',
    color: '#fff',
  },
  heartButton: {
    padding: DIMENSIONS.PADDING_XS,
    borderRadius: DIMENSIONS.RADIUS_LG,
    backgroundColor: '#333',
  },
  heartButtonActive: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
  },
  scientificNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  scientificName: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    color: '#666',
    fontStyle: 'italic',
    flex: 1,
  },
  pointsBadge: {
    backgroundColor: '#007AFF',
    borderRadius: DIMENSIONS.RADIUS_SM,
    paddingHorizontal: DIMENSIONS.PADDING_XS,
    paddingVertical: DIMENSIONS.PADDING_XS,
    marginLeft: DIMENSIONS.SPACE_SM,
  },
  pointsBadgeText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.SPACE_LG,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    paddingVertical: DIMENSIONS.PADDING_LG,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
  },
  tabText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.SPACE_XXXL,
  },
  section: {
    marginBottom: DIMENSIONS.SPACE_XL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  sectionText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
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
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#666',
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
    fontWeight: '600',
  },
  sightingsList: {
    paddingBottom: DIMENSIONS.PADDING_LG,
  },
  sightingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_LG,
    padding: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  sightingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  sightingNumber: {
    backgroundColor: '#007AFF',
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: DIMENSIONS.PADDING_SM,
    paddingVertical: DIMENSIONS.PADDING_XS,
  },
  sightingNumberText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.SIZE_LG,
  },
  sightingDateInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACE_XS,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  sightingDate: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#fff',
    fontWeight: '600',
  },
  sightingTime: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#666',
  },
  diveSiteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.SPACE_XS,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  diveSiteName: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: DIMENSIONS.MARGIN_SM,
  },
  detailLabelNew: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#666',
    fontWeight: '600',
    width: 100,
  },
  detailValueNew: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#ccc',
    flex: 1,
  },
  imageSection: {
    marginTop: DIMENSIONS.MARGIN_MD,
    borderRadius: DIMENSIONS.RADIUS_SM,
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
    paddingTop: DIMENSIONS.PADDING_MD,
  },
  notesLabel: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#666',
    marginBottom: DIMENSIONS.MARGIN_XS,
  },
  notesText: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#ccc',
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.PADDING_XXXL,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    color: '#666',
    marginBottom: DIMENSIONS.MARGIN_SM,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#444',
  },
  actionButtonsContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    paddingTop: DIMENSIONS.PADDING_MD,
    flexDirection: 'row',
    gap: DIMENSIONS.GAP_MD,
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
    padding: DIMENSIONS.PADDING_LG,
    borderRadius: DIMENSIONS.RADIUS_LG,
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
    paddingVertical: DIMENSIONS.PADDING_LG,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: DIMENSIONS.GAP_SM,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: '600',
  },
});