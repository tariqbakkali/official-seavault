import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Filter } from 'lucide-react-native';
import { Database } from '@/types/database';
import { useSyncedData } from '@/hooks/useSyncedData';
import ExploreDiveSiteCard from '@/screens/modal/explore/components/ExploreDiveSiteCard';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';

type DiveSite = Database['public']['Tables']['dive_sites']['Row'];

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function ExploreModal() {
  const [diveSites, setDiveSites] = React.useState<DiveSite[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showFilters, setShowFilters] = React.useState(false);
  const [filterOptions, setFilterOptions] = React.useState({
    category: null as string | null,
    sortBy: 'name' as 'name' | 'points',
    sortOrder: 'asc' as 'asc' | 'desc',
  });
  const insets = useSafeAreaInsets();
  
  // Use the new useSyncedData hook instead of useDataStore
  const { diveSites: diveSitesData } = useSyncedData();

  const topExploreItems = React.useMemo(() => {
    if (!diveSites) return [];

    // Since dive sites don't have user ownership, just return the first 5 items
    return diveSites.slice(0, 5);
  }, [diveSites]);

  const loadData = async () => {
    try {
      // Extract dive sites from the observable with proper typing
      let sites: DiveSite[] = [];
      if (diveSitesData) {
        // Handle both object format (with ID keys) and array format
        if (Array.isArray(diveSitesData)) {
          sites = diveSitesData as DiveSite[];
        } else {
          // Extract values and filter out null/undefined entries
          sites = Object.values(diveSitesData)
            .filter((site): site is DiveSite => 
              site !== null && 
              site !== undefined && 
              typeof site === 'object' && 
              'id' in site
            ) as DiveSite[];
        }
      }
      setDiveSites(sites);
    } catch (error) {
      console.error('Error loading dive sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing dive sites:', error);
    }
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadData();
  }, [diveSitesData]);

  const handleDiveSitePress = (diveSiteId: string) => {
    router.push(`/categories/${diveSiteId}`);
  };

  const renderDiveSite = ({ item }: { item: DiveSite }) => {
    return (
      <ExploreDiveSiteCard
        diveSite={item}
        onPress={() => handleDiveSitePress(item.id)}
        isCurrentUserItem={false} // Dive sites don't have user ownership
      />
    );
  };

  const toggleSortOrder = () => {
    setFilterOptions(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
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
          title="Explore" 
          onBackPress={() => router.back()}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dive sites...</Text>
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
        title="Explore" 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dive sites..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort by:</Text>
            <TouchableOpacity 
              style={[styles.filterOption, filterOptions.sortBy === 'name' && styles.filterOptionActive]}
              onPress={() => setFilterOptions(prev => ({ ...prev, sortBy: 'name' }))}
            >
              <Text style={[styles.filterText, filterOptions.sortBy === 'name' && styles.filterTextActive]}>
                Name
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.filterOption}
              onPress={toggleSortOrder}
            >
              <Text style={styles.filterText}>
                {filterOptions.sortOrder === 'asc' ? '↑' : '↓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={topExploreItems}
        keyExtractor={(item) => item.id}
        renderItem={renderDiveSite}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No dive sites found</Text>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.SPACE_LG,
    gap: DIMENSIONS.SPACE_LG,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: DIMENSIONS.PADDING_SM,
  },
  searchIcon: {
    marginRight: DIMENSIONS.SPACE_SM,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: TYPOGRAPHY.SIZE_LG,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: DIMENSIONS.RADIUS_MD,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: DIMENSIONS.PADDING_LG,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  filterLabel: {
    color: '#fff',
    fontWeight: '600',
    marginRight: DIMENSIONS.SPACE_LG,
    width: 80,
  },
  filterOption: {
    paddingHorizontal: DIMENSIONS.PADDING_SM,
    paddingVertical: DIMENSIONS.PADDING_XS,
    borderRadius: DIMENSIONS.RADIUS_LG,
    backgroundColor: '#333',
    marginRight: DIMENSIONS.SPACE_SM,
    marginBottom: DIMENSIONS.SPACE_SM,
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#ccc',
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
  filterTextActive: {
    color: '#fff',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  listContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_LG,
    paddingBottom: DIMENSIONS.PADDING_LG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: TYPOGRAPHY.SIZE_LG,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: DIMENSIONS.PADDING_XXXL,
  },
  emptyText: {
    color: '#666',
    fontSize: TYPOGRAPHY.SIZE_LG,
  },
});