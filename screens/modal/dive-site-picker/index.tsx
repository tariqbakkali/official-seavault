import React, { useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  FlatList,
  RefreshControl
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
    // Pass the selected dive site back to the log dive screen
    router.push({
      pathname: '/(tabs)/log-dive',
      params: { 
        selectedDiveSiteId: siteId,
        diveSiteEntryId: diveSiteEntryId
      }
    } as any);
  };

  // Filter and prioritize dive sites based on search query
  const filteredDiveSites = useMemo(() => {
    const diveSitesArray = allDiveSites ? Object.values(allDiveSites) as DiveSite[] : [];
    
    if (!searchQuery) return diveSitesArray;
    
    const query = searchQuery.toLowerCase();
    
    // Separate sites that start with the query and those that contain it
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
    
    // Return prioritized list (starts with query first, then contains query)
    return [...startsWithQuery, ...containsQuery];
  }, [allDiveSites, searchQuery]);

  // Render dive site item for the list
  const renderDiveSiteItem = ({ item }: { item: DiveSite }) => (
    <TouchableOpacity 
      style={styles.diveSiteItem}
      onPress={() => handleDiveSiteSelect(item.id)}
    >
      <Text style={styles.diveSiteName}>{item.name}</Text>
      <Text style={styles.diveSiteLocation}>
        {item.latitude?.toFixed(4)}, {item.longitude?.toFixed(4)}
      </Text>
    </TouchableOpacity>
  );

  const handleAddNewDiveSite = () => {
    router.push('/dive-sites/add');
  };

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top, 
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <ScreenHeader 
        title="Select Dive Site" 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.diveSiteSearchInput}
          placeholder="Search dive sites..."
          placeholderTextColor={COLORS.TEXT_TERTIARY}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      {/* Add New Dive Site Button */}
      <TouchableOpacity 
        style={styles.addButton}
        onPress={handleAddNewDiveSite}
      >
        <Text style={styles.addButtonText}>+ Add New Dive Site</Text>
      </TouchableOpacity>

      <FlatList
        data={filteredDiveSites}
        keyExtractor={(item) => item.id}
        renderItem={renderDiveSiteItem}
        style={styles.diveSiteList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.PRIMARY}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No dive sites found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  searchContainer: {
    padding: DIMENSIONS.PADDING_HORIZONTAL,
    paddingTop: DIMENSIONS.SPACE_MD,
  },
  diveSiteSearchInput: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    backgroundColor: COLORS.SURFACE,
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
  },
  addButton: {
    marginHorizontal: DIMENSIONS.PADDING_HORIZONTAL,
    marginBottom: DIMENSIONS.SPACE_MD,
    backgroundColor: COLORS.PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    alignItems: 'center',
  },
  addButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  diveSiteList: {
    flex: 1,
  },
  diveSiteItem: {
    padding: DIMENSIONS.SPACE_LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  diveSiteName: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  diveSiteLocation: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
    marginTop: DIMENSIONS.SPACE_XS,
  },
  emptyState: {
    padding: DIMENSIONS.SPACE_LG,
    alignItems: 'center',
  },
  emptyStateText: {
    color: COLORS.TEXT_TERTIARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
  },
});