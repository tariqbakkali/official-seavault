import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, X, ChevronLeft, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence } from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import OfflineImageHandler from '@/components/OfflineImageHandler';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_WIDTH = (width - DIMENSIONS.PADDING_LG * 2 - DIMENSIONS.SPACE_MD * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

interface UniversalCreaturePickerProps {
  visible: boolean;
  onClose: () => void;
  onAddCreatures: (creatures: any[]) => void;
  catalog: any;
  initialSelectedCreatureIds?: string[];
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const CreatureGridItem = ({ item, isSelected, onToggle }: { item: any, isSelected: boolean, onToggle: (id: string) => void }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Animation
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    onToggle(item.id);
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.gridItem, isSelected && styles.selectedGridItem, animatedStyle]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <OfflineImageHandler
        uri={item.image_url}
        style={styles.gridImage}
        containerStyle={styles.gridImageContainer}
      />
      {isSelected && (
        <View style={styles.checkmarkOverlay}>
          <Check size={20} color="#fff" strokeWidth={3} />
        </View>
      )}
      <View style={[styles.gridLabelContainer, isSelected && styles.selectedGridLabelContainer]}>
        <Text style={[styles.gridLabel, isSelected && styles.selectedGridLabel]} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const UniversalCreaturePicker: React.FC<UniversalCreaturePickerProps> = ({
  visible,
  onClose,
  onAddCreatures,
  catalog,
  initialSelectedCreatureIds = [],
}) => {
  const [currentView, setCurrentView] = useState<'categories' | 'creatures'>('categories');
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [selectedCreatureIds, setSelectedCreatureIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const insets = useSafeAreaInsets();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 50;

  // Reset state when opening/closing
  React.useEffect(() => {
    if (visible) {
      setCurrentView('categories');
      setSelectedCategory(null);
      setSearchQuery('');
      setSelectedCreatureIds(new Set(initialSelectedCreatureIds));
      // Reset pagination
      setCurrentPage(0);
      setHasMore(true);
    }
  }, [visible, initialSelectedCreatureIds]);

  // Reset pagination when search or category changes
  React.useEffect(() => {
    // Reset pagination whenever the data source criteria changes
    setCurrentPage(0);
    setHasMore(true);
  }, [searchQuery, selectedCategory, currentView, visible]);

  const handleCategoryPress = (category: any) => {
    Haptics.selectionAsync();
    setSelectedCategory(category);
    setCurrentView('creatures');
    setSearchQuery(''); // Clear search when entering category
  };

  const handleCreatureToggle = (creatureId: string) => {
    const newSet = new Set(selectedCreatureIds);
    if (newSet.has(creatureId)) {
      newSet.delete(creatureId);
    } else {
      newSet.add(creatureId);
    }
    setSelectedCreatureIds(newSet);
  };

  const handleBackToCategories = () => {
    Haptics.selectionAsync();
    setCurrentView('categories');
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Find full creature objects
    const allCreatures = catalog?.creatures || [];
    const selected = allCreatures.filter((c: any) => selectedCreatureIds.has(c.id));
    onAddCreatures(selected);
    onClose();
  };

  // Filter Logic with Pagination
  const filteredData = useMemo(() => {
    // If there is a search query, we search EVERYTHING (categories + creatures)
    // unless we are specifically inside a category view
    if (searchQuery && currentView === 'categories') {
      const lowerQuery = searchQuery.toLowerCase();

      const categories = catalog?.categories || [];
      const matchingCategories = categories.filter((c: any) =>
        c.name.toLowerCase().includes(lowerQuery)
      ).map((c: any) => ({ ...c, type: 'category' }));

      const creatures = catalog?.creatures || [];
      const matchingCreatures = creatures.filter((c: any) =>
        c.name.toLowerCase().includes(lowerQuery) ||
        c.scientific_name?.toLowerCase().includes(lowerQuery)
      ).map((c: any) => ({ ...c, type: 'creature' }));

      // Combine results
      const combined = [...matchingCategories, ...matchingCreatures];

      // Apply pagination to the combined results
      const endIndex = (currentPage + 1) * PAGE_SIZE;
      const paginatedData = combined.slice(0, endIndex);
      
      // Update hasMore based on whether we've shown all data
      setHasMore(paginatedData.length < combined.length);

      return paginatedData;
    }

    if (currentView === 'categories') {
      const categories = catalog?.categories || [];
      // No search query, just return categories (no pagination needed)
      setHasMore(false); // Categories don't paginate
      return categories.map((c: any) => ({ ...c, type: 'category' }));
    } else {
      // Creatures View (inside a category)
      let creatures = catalog?.creatures || [];

      // Filter by Category if selected
      if (selectedCategory) {
        creatures = creatures.filter((c: any) => c.category_id === selectedCategory.id);
      }

      // Filter by Search (if searching inside a category)
      if (searchQuery) {
        creatures = creatures.filter((c: any) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.scientific_name?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Mark as creatures
      creatures = creatures.map((c: any) => ({ ...c, type: 'creature' }));

      // Apply pagination
      const endIndex = (currentPage + 1) * PAGE_SIZE;
      const paginatedCreatures = creatures.slice(0, endIndex);
      
      // Update hasMore based on whether we've shown all creatures
      setHasMore(paginatedCreatures.length < creatures.length);

      return paginatedCreatures;
    }
  }, [currentView, selectedCategory, searchQuery, catalog, currentPage, PAGE_SIZE]);

  const renderCategoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <OfflineImageHandler
        uri={item.image_url}
        style={styles.gridImage}
        containerStyle={styles.gridImageContainer}
      />
      <View style={styles.gridLabelContainer}>
        <Text style={styles.gridLabel} numberOfLines={2}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'category') {
      return renderCategoryItem({ item });
    } else {
      // Creature Item
      const isSelected = selectedCreatureIds.has(item.id);
      return (
        <CreatureGridItem
          item={item}
          isSelected={isSelected}
          onToggle={handleCreatureToggle}
        />
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {currentView === 'creatures' ? (
              <TouchableOpacity onPress={handleBackToCategories} style={styles.iconButton}>
                <ChevronLeft size={28} color={COLORS.PRIMARY} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                <X size={28} color={COLORS.TEXT_PRIMARY} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.headerTitle}>
            {currentView === 'categories'
              ? (searchQuery ? 'Search Results' : 'Select Category')
              : selectedCategory?.name || 'Select Creatures'}
          </Text>

          <View style={styles.headerRight} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={COLORS.TEXT_TERTIARY} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={currentView === 'categories' ? "Search categories & creatures..." : "Search creatures..."}
            placeholderTextColor={COLORS.TEXT_TERTIARY}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>

        {/* Content */}
        <FlatList
          style={{ flex: 1 }}
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              setLoadingMore(true);
              setTimeout(() => {
                setCurrentPage(prev => prev + 1);
                setLoadingMore(false);
              }, 300);
            }
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingFooter}>
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
                <Text style={styles.loadingText}>Loading more...</Text>
              </View>
            ) : null
          }
        />

        {/* Footer with Add Button */}
        {selectedCreatureIds.size > 0 && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + DIMENSIONS.PADDING_MD }]}>
            <TouchableOpacity onPress={handleDone} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Add ({selectedCreatureIds.size}) Creatures</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    paddingVertical: DIMENSIONS.SPACE_MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  headerLeft: {
    width: 80,
    alignItems: 'flex-start',
  },
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    flex: 1,
  },
  iconButton: {
    padding: 4,
  },

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    margin: DIMENSIONS.MARGIN_MD,
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    borderRadius: DIMENSIONS.RADIUS_MD,
    height: 44,
  },
  searchIcon: {
    marginRight: DIMENSIONS.SPACE_SM,
  },
  searchInput: {
    flex: 1,
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    height: '100%',
  },
  listContent: {
    padding: DIMENSIONS.PADDING_LG,
  },
  columnWrapper: {
    gap: DIMENSIONS.SPACE_MD,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  gridItem: {
    width: ITEM_WIDTH,
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
  },
  selectedGridItem: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '20', // 20% opacity hex
  },
  gridImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#2a2a2a',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridLabelContainer: {
    padding: DIMENSIONS.SPACE_XS,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedGridLabelContainer: {
    backgroundColor: COLORS.PRIMARY,
  },
  gridLabel: {
    fontSize: TYPOGRAPHY.SIZE_XS,
    color: COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedGridLabel: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkmarkOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  emptyContainer: {
    padding: DIMENSIONS.PADDING_XL,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
  footer: {
    padding: DIMENSIONS.PADDING_MD,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER_PRIMARY,
    backgroundColor: COLORS.SURFACE,
  },
  doneButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: DIMENSIONS.SPACE_MD,
    borderRadius: DIMENSIONS.RADIUS_LG,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
  loadingFooter: {
    paddingVertical: DIMENSIONS.PADDING_LG,
    alignItems: 'center',
    gap: DIMENSIONS.SPACE_SM,
  },
  loadingText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_SM,
    marginTop: DIMENSIONS.SPACE_XS,
  },
});

export default UniversalCreaturePicker;
