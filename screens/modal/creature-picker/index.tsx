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
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, Filter } from 'lucide-react-native';
import { Database } from '@/types/database';
import { useCatalogStore } from '@/stores/catalog';
import ImageWithFallback from '@/components/ImageWithFallback';

type Creature = Database['public']['Tables']['creatures']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function CreaturePickerScreen() {
  const [creatures, setCreatures] = React.useState<Creature[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
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
  
  const params = useLocalSearchParams();
  const creatureEntryId = params.creatureEntryId as string;
  
  const { getCreatures, getCategories } = useCatalogStore();

  const loadData = async () => {
    try {
      const [creaturesList, categoriesList] = await Promise.all([
        getCreatures(),
        getCategories()
      ]);
      setCreatures(creaturesList);
      setCategories(categoriesList);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setRefreshing(false);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleCreatureSelect = (creatureId: string) => {
    // Pass the selected creature back to the log dive screen
    router.push({
      pathname: '/(tabs)/log-dive',
      params: { 
        selectedCreatureId: creatureId,
        creatureEntryId: creatureEntryId
      }
    } as any);
  };

  const renderCreature = ({ item }: { item: Creature }) => {
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => handleCreatureSelect(item.id)}
      >
        <View style={styles.imageContainer}>
          <ImageWithFallback 
            uri={item.image_url || undefined}
            style={styles.image}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.points}>{item.points} points</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const toggleSortOrder = () => {
    setFilterOptions(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter creatures based on search and filters
  const filteredCreatures = React.useMemo(() => {
    let result = [...creatures];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(creature => 
        creature.name.toLowerCase().includes(query) ||
        (creature.scientific_name && creature.scientific_name.toLowerCase().includes(query))
      );
    }
    
    // Apply category filter
    if (filterOptions.category) {
      result = result.filter(creature => creature.category_id === filterOptions.category);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      if (filterOptions.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (filterOptions.sortBy === 'points') {
        comparison = a.points - b.points;
      }
      
      return filterOptions.sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return result;
  }, [creatures, searchQuery, filterOptions]);

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Creature</Text>
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
        <Text style={styles.title}>Select Creature</Text>
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
              style={[styles.filterOption, !filterOptions.category && styles.filterOptionActive]}
              onPress={() => setFilterOptions(prev => ({ ...prev, category: null }))}
            >
              <Text style={[styles.filterText, !filterOptions.category && styles.filterTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map(category => (
              <TouchableOpacity
                key={category.id}
                style={[styles.filterOption, filterOptions.category === category.id && styles.filterOptionActive]}
                onPress={() => setFilterOptions(prev => ({ ...prev, category: category.id }))}
              >
                <Text style={[styles.filterText, filterOptions.category === category.id && styles.filterTextActive]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
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
              style={[styles.filterOption, filterOptions.sortBy === 'points' && styles.filterOptionActive]}
              onPress={() => setFilterOptions(prev => ({ ...prev, sortBy: 'points' }))}
            >
              <Text style={[styles.filterText, filterOptions.sortBy === 'points' && styles.filterTextActive]}>
                Points
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
        data={filteredCreatures}
        keyExtractor={(item) => item.id}
        renderItem={renderCreature}
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
            <Text style={styles.emptyText}>No creatures found</Text>
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
  card: {
    width: cardWidth,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  imageContainer: {
    height: 120,
    backgroundColor: '#2a2a2a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: 12,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  points: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
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