import { Plus, MapPin, Search } from 'lucide-react-native';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Database } from '@/types/database';
import { useSyncedData } from '@/hooks/useSyncedData';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { forceSyncAll } from '@/utils/syncUtils';

type DiveSite = Database['public']['Tables']['dive_sites']['Row'];

export default function DiveSitePickerScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams();
  const diveSiteEntryId = params.diveSiteEntryId as string;

  const { diveSites: allDiveSites } = useSyncedData();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await forceSyncAll();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDiveSiteSelect = (siteId: string) => {
    router.replace({
      pathname: '/(tabs)/log-dive',
      params: {
        selectedDiveSiteId: siteId,
        diveSiteEntryId: diveSiteEntryId,
      },
    } as any);
  };

  const handleAddNewDiveSite = () => {
    router.push('/dive-sites/add');
  };

  // Filter and prioritize dive sites based on search query
  const filteredDiveSites = useMemo(() => {
    const diveSitesArray = allDiveSites
      ? (Object.values(allDiveSites) as DiveSite[])
      : [];

    if (!searchQuery) return diveSitesArray;

    const query = searchQuery.toLowerCase();

    const startsWithQuery: DiveSite[] = [];
    const containsQuery: DiveSite[] = [];

    diveSitesArray.forEach((site: DiveSite) => {
      const siteName = site.name.toLowerCase();
      if (siteName.startsWith(query)) {
        startsWithQuery.push(site);
      } else if (siteName.includes(query)) {
        containsQuery.push(site);
      }
    });

    return [...startsWithQuery, ...containsQuery];
  }, [allDiveSites, searchQuery]);

  // Render dive site item for the list
  const renderDiveSiteItem = ({ item }: { item: DiveSite }) => {
    return (
      <TouchableOpacity
        style={styles.diveSiteItem}
        onPress={() => handleDiveSiteSelect(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.diveSiteContent}>
          <View style={styles.iconContainer}>
            <MapPin size={20} color={COLORS.PRIMARY} />
          </View>
          <View style={styles.diveSiteInfo}>
            <Text style={styles.diveSiteName} numberOfLines={1}>
              {item.name}
            </Text>
            {(item.latitude || item.longitude) && (
              <Text style={styles.diveSiteLocation} numberOfLines={1}>
                {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
      ]}
    >
      <ScreenHeader
        title="Select Dive Site"
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      <View style={styles.contentContainer}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Search size={20} color={COLORS.TEXT_TERTIARY} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dive sites..."
              placeholderTextColor={COLORS.TEXT_TERTIARY}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Add New Dive Site Button */}
        <View style={styles.addButtonContainer}>
          <TouchableOpacity
            style={styles.addNewButton}
            onPress={handleAddNewDiveSite}
            activeOpacity={0.8}
          >
            <View style={styles.addButtonIconContainer}>
              <Plus size={20} color={COLORS.SURFACE} />
            </View>
            <Text style={styles.addNewButtonText}>Add New Dive Site</Text>
          </TouchableOpacity>
        </View>

        {/* Dive Sites List */}
        <FlatList
          data={filteredDiveSites}
          keyExtractor={(item) => item.id}
          renderItem={renderDiveSiteItem}
          style={styles.diveSiteList}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.PRIMARY}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MapPin size={48} color={COLORS.TEXT_TERTIARY} />
              <Text style={styles.emptyStateTitle}>No dive sites found</Text>
              <Text style={styles.emptyStateSubtitle}>
                {searchQuery
                  ? 'Try adjusting your search'
                  : 'Add your first dive site to get started'}
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  contentContainer: {
    flex: 1,
    paddingTop: DIMENSIONS.SPACE_MD,
  },
  searchContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: DIMENSIONS.SPACE_LG,
    paddingVertical: DIMENSIONS.SPACE_SM,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    gap: DIMENSIONS.SPACE_SM,
  },
  searchInput: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
    paddingVertical: DIMENSIONS.SPACE_SM,
  },
  addButtonContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingVertical: DIMENSIONS.SPACE_LG,
    paddingHorizontal: DIMENSIONS.SPACE_LG,
    gap: DIMENSIONS.SPACE_SM,
  },
  addButtonIconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addNewButtonText: {
    color: COLORS.SURFACE,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  diveSiteList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    paddingBottom: DIMENSIONS.SPACE_LG,
  },
  diveSiteItem: {
    // backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    marginBottom: DIMENSIONS.SPACE_MD,
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    overflow: 'hidden',
  },
  diveSiteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.SPACE_LG,
    gap: DIMENSIONS.SPACE_MD,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: DIMENSIONS.RADIUS_SM,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diveSiteInfo: {
    flex: 1,
    gap: DIMENSIONS.SPACE_XS,
  },
  diveSiteName: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  diveSiteLocation: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.SPACE_XL * 2,
    paddingHorizontal: DIMENSIONS.SPACE_XL,
    gap: DIMENSIONS.SPACE_MD,
  },
  emptyStateTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_TERTIARY,
    textAlign: 'center',
  },
});
