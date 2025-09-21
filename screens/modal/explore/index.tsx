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
import { syncService } from '@/services/syncService';
import { loadCatalogCache, loadUserDataCache } from '@/services/cache';
import { Creature, Category, CachedUserData } from '@/types/database';
import ExploreCreatureCard from '@/screens/modal/explore/components/ExploreCreatureCard';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

interface FilterOptions {
  category: string | null;
  sortBy: 'name' | 'points';
  sortOrder: 'asc' | 'desc';
}

export default function ExploreScreen() {
  const [creatures, setCreatures] = React.useState<Creature[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [filteredCreatures, setFilteredCreatures] = React.useState<Creature[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterOptions, setFilterOptions] = React.useState<FilterOptions>({
    category: null,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [showFilters, setShowFilters] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [seenCreatures, setSeenCreatures] = React.useState<Set<string>>(new Set());
  const insets = useSafeAreaInsets();

  const loadData = async () => {
    try {
      await syncService.checkConnectivity();
      const catalog = await syncService.pullCatalog();
      
      // Load user data to determine seen creatures
      const userData = await syncService.pullUserData();
      
      if (catalog) {
        setCreatures(catalog.creatures);
        setCategories(catalog.categories);
        setFilteredCreatures(catalog.creatures);
      }
      
      if (userData) {
        const seen: Set<string> = new Set(userData.sightings.map(s => s.creature_id));
        setSeenCreatures(seen);
      }
    } catch (error) {
      console.error('Error loading explore data:', error);
      // Fallback to cache
      const [cachedCatalog, cachedUserData] = await Promise.all([
        loadCatalogCache(),
        loadUserDataCache()
      ]);
      
      if (cachedCatalog) {
        setCreatures(cachedCatalog.creatures);
        setCategories(cachedCatalog.categories);
        setFilteredCreatures(cachedCatalog.creatures);
      }
      
      if (cachedUserData) {
        const seen: Set<string> = new Set(cachedUserData.sightings.map(s => s.creature_id));
        setSeenCreatures(seen);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await syncService.fullSync();
      await loadData();
    } catch (error) {
      console.error('Error refreshing explore data:', error);
    }
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  // Apply filters and search
  React.useEffect(() => {
    let result = [...creatures];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(creature => 
        creature.name.toLowerCase().includes(query) ||
        (creature.scientific_name && creature.scientific_name.toLowerCase().includes(query)) ||
        (creature.description && creature.description.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (filterOptions.category) {
      result = result.filter(creature => creature.category_id === filterOptions.category);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (filterOptions.sortBy === 'name') {
        const comparison = a.name.localeCompare(b.name);
        return filterOptions.sortOrder === 'asc' ? comparison : -comparison;
      } else {
        const comparison = (a.points || 0) - (b.points || 0);
        return filterOptions.sortOrder === 'asc' ? comparison : -comparison;
      }
    });
    
    setFilteredCreatures(result);
  }, [creatures, searchQuery, filterOptions]);

  const handleCreaturePress = (creatureId: string) => {
    router.push(`/creatures/${creatureId}`);
  };

  const renderCreature = ({ item }: { item: Creature }) => {
    // Find the category name for this creature
    const category = categories.find(cat => cat.id === item.category_id);
    
    return (
      <ExploreCreatureCard
        creature={{
          ...item,
          isDiscovered: seenCreatures.has(item.id),
          category: category?.name || 'Unknown'
        }}
        onPress={() => handleCreaturePress(item.id)}
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
          <Text style={styles.loadingText}>Loading creatures...</Text>
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
            placeholder="Search creatures..."
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
            <Text style={styles.filterLabel}>Category:</Text>
            <TouchableOpacity 
              style={[
                styles.categoryFilter,
                !filterOptions.category && styles.activeCategoryFilter
              ]}
              onPress={() => setFilterOptions(prev => ({ ...prev, category: null }))}
            >
              <Text style={[
                styles.categoryFilterText,
                !filterOptions.category && styles.activeCategoryFilterText
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryFilter,
                  filterOptions.category === category.id && styles.activeCategoryFilter
                ]}
                onPress={() => setFilterOptions(prev => ({ ...prev, category: category.id }))}
              >
                <Text style={[
                  styles.categoryFilterText,
                  filterOptions.category === category.id && styles.activeCategoryFilterText
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Sort by:</Text>
            <TouchableOpacity 
              style={styles.sortButton}
              onPress={() => setFilterOptions(prev => ({ 
                ...prev, 
                sortBy: prev.sortBy === 'name' ? 'points' : 'name' 
              }))}
            >
              <Text style={styles.sortButtonText}>
                {filterOptions.sortBy === 'name' ? 'Name' : 'Points'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sortOrderButton}
              onPress={toggleSortOrder}
            >
              <Text style={styles.sortOrderText}>
                {filterOptions.sortOrder === 'asc' ? '↑' : '↓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredCreatures.length} {filteredCreatures.length === 1 ? 'creature' : 'creatures'}
        </Text>
      </View>

      {filteredCreatures.length === 0 ? (
        <View style={styles.emptyState}>
          <Search size={48} color="#666" />
          <Text style={styles.emptyTitle}>No creatures found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search or filters
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCreatures}
          keyExtractor={(item) => item.id}
          renderItem={renderCreature}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
        />
      )}
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
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 16,
  },
  filterButton: {
    width: 50,
    height: 50,
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
  filterRowLast: {
    marginBottom: 0,
  },
  filterLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginRight: 12,
    width: 70,
  },
  categoryFilter: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  activeCategoryFilter: {
    backgroundColor: '#007AFF',
  },
  categoryFilterText: {
    fontSize: 12,
    color: '#666',
  },
  activeCategoryFilterText: {
    color: '#fff',
  },
  sortButton: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  sortButtonText: {
    fontSize: 12,
    color: '#fff',
  },
  sortOrderButton: {
    backgroundColor: '#007AFF',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortOrderText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 20,
  },
});