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
import { ArrowLeft, Search, Filter } from 'lucide-react-native';
import { Database } from '@/types/database';
import { useDataStore } from '@/stores/data';
import ExploreDiveSiteCard from '@/screens/modal/explore/components/ExploreDiveSiteCard';

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
  
  // Use the new data store instead of dataService
  const { fetchDiveSites } = useDataStore();

  const loadData = async () => {
    try {
      // Fetch dive sites directly from the new store
      const sites = await fetchDiveSites();
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
  }, []);

  const handleDiveSitePress = (diveSiteId: string) => {
    router.push(`/categories/${diveSiteId}`);
  };

  const renderDiveSite = ({ item }: { item: DiveSite }) => {
    return (
      <ExploreDiveSiteCard
        diveSite={item}
        onPress={() => handleDiveSitePress(item.id)}
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
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Explore</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading dive sites...</Text>
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
        <Text style={styles.title}>Explore</Text>
        <View style={styles.placeholder} />
      </View>

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
        data={diveSites}
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#fff',
    fontSize: 16,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  filterLabel: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 12,
    width: 80,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#333',
    marginRight: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    color: '#ccc',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#fff',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});