import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Search } from 'lucide-react-native';
import { Creature, CachedCatalog, CachedUserData } from '@/types/database';
import { loadCatalogCache, loadUserDataCache } from '@/services/cache';
import ImageWithFallback from '@/components/ImageWithFallback';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';

const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;

export default function CategoryCreaturesScreen() {
  const { id } = useLocalSearchParams();
  const [creatures, setCreatures] = React.useState<Creature[]>([]);
  const [categoryName, setCategoryName] = React.useState('');
  const [seenCreatures, setSeenCreatures] = React.useState<Set<string>>(new Set<string>());
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [catalog, userData] = await Promise.all([
        loadCatalogCache(),
        loadUserDataCache()
      ]);

      if (catalog && userData) {
        const category = catalog.categories.find(c => c.id === id);
        setCategoryName(category?.name || 'Category');

        const categoryCreatures = catalog.creatures.filter(c => c.category_id === id);
        setCreatures(categoryCreatures);

        const seen: Set<string> = new Set(userData.sightings.map(s => s.creature_id));
        setSeenCreatures(seen);
      }
    } catch (error) {
      console.error('Error loading category creatures:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter creatures based on search query
  const filteredCreatures = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return creatures;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return creatures.filter(creature => 
      creature.name.toLowerCase().includes(query) ||
      (creature.scientific_name && creature.scientific_name.toLowerCase().includes(query)) ||
      (creature.description && creature.description.toLowerCase().includes(query))
    );
  }, [creatures, searchQuery]);

  const renderCreature = ({ item }: { item: Creature }) => {
    const isSeen = seenCreatures.has(item.id);

    return (
      <TouchableOpacity
        style={styles.creatureCard}
        onPress={() => router.push(`/creatures/${item.id}`)}
      >
        <ImageWithFallback
          uri={item.image_url}
          style={styles.creatureImage}
          containerStyle={styles.imageContainer}
        />
        {isSeen && (
          <View style={styles.seenBadge}>
            <Check size={16} color="#fff" />
          </View>
        )}
        <View style={styles.creatureInfo}>
          <Text style={styles.creatureName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.scientific_name && (
            <Text style={styles.scientificName} numberOfLines={1}>
              {item.scientific_name}
            </Text>
          )}
          {item.points && (
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>{item.points} pts</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Loading...</Text>
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
        <Text style={styles.title}>{categoryName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={COLORS.TEXT_TERTIARY} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search creatures..."
            placeholderTextColor={COLORS.TEXT_TERTIARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredCreatures.length} of {creatures.length} {filteredCreatures.length === 1 ? 'creature' : 'creatures'}
        </Text>
      </View>

      {filteredCreatures.length === 0 ? (
        <View style={styles.emptyState}>
          <Search size={48} color={COLORS.TEXT_TERTIARY} />
          <Text style={styles.emptyTitle}>No creatures found</Text>
          <Text style={styles.emptySubtitle}>
            Try adjusting your search query
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingTop: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.SIZE_TITLE,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD as any,
    color: COLORS.TEXT_PRIMARY,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: 16,
  },
  resultsHeader: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    marginBottom: 8,
  },
  resultsCount: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD as any,
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_TERTIARY,
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
  },
  creatureCard: {
    width: cardWidth,
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    marginBottom: DIMENSIONS.SPACE_LG,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 120,
  },
  creatureImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  seenBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.SUCCESS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatureInfo: {
    padding: DIMENSIONS.SPACE_MD,
  },
  creatureName: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD as any,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  scientificName: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  pointsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: DIMENSIONS.SPACE_SM,
    paddingVertical: DIMENSIONS.SPACE_XS,
    borderRadius: DIMENSIONS.RADIUS_SM,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.SIZE_XS,
    color: COLORS.TEXT_PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD as any,
  },
});