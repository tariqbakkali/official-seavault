import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, FlatList, Modal } from 'react-native';
import { COLORS, DIMENSIONS, TYPOGRAPHY } from '@/constants';
import { Database } from '@/types/database';

interface DiveSiteSelectorProps {
  diveSites: Database['public']['Tables']['dive_sites']['Row'][] | null;
  selectedDiveSiteId: string | null;
  showDiveSiteSearch: boolean;
  setShowDiveSiteSearch: (show: boolean) => void;
  diveSiteSearchQuery: string;
  setDiveSiteSearchQuery: (query: string) => void;
  handleDiveSiteSelect: (siteId: string) => void;
  onAddNewDiveSite: () => void;
}

const DiveSiteSelector: React.FC<DiveSiteSelectorProps> = ({
  diveSites,
  selectedDiveSiteId,
  showDiveSiteSearch,
  setShowDiveSiteSearch,
  diveSiteSearchQuery,
  setDiveSiteSearchQuery,
  handleDiveSiteSelect,
  onAddNewDiveSite,
}) => {
  // Filter and prioritize dive sites based on search query
  const filteredDiveSites = React.useMemo(() => {
    if (!diveSites) return [];
    
    if (!diveSiteSearchQuery) return diveSites;
    
    const query = diveSiteSearchQuery.toLowerCase();
    
    // Separate sites that start with the query and those that contain it
    const startsWithQuery: Database['public']['Tables']['dive_sites']['Row'][] = [];
    const containsQuery: Database['public']['Tables']['dive_sites']['Row'][] = [];
    
    diveSites.forEach(site => {
      const siteName = site.name.toLowerCase();
      if (siteName.startsWith(query)) {
        startsWithQuery.push(site);
      } else if (siteName.includes(query)) {
        containsQuery.push(site);
      }
    });
    
    // Return prioritized list (starts with query first, then contains query)
    return [...startsWithQuery, ...containsQuery];
  }, [diveSites, diveSiteSearchQuery]);

  // Render dive site item for the list
  const renderDiveSiteItem = ({ item }: { item: Database['public']['Tables']['dive_sites']['Row'] }) => (
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

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Dive Site</Text>
      
      <TouchableOpacity 
        style={styles.diveSiteSelector}
        onPress={() => setShowDiveSiteSearch(true)}
      >
        <Text style={selectedDiveSiteId ? styles.diveSiteSelectedText : styles.diveSitePlaceholderText}>
          {selectedDiveSiteId 
            ? diveSites?.find(site => site.id === selectedDiveSiteId)?.name 
            : "Select a dive site"}
        </Text>
        <Text style={styles.diveSiteSelectorIcon}>›</Text>
      </TouchableOpacity>

      {/* Add New Dive Site Button - Navigate to new screen */}
      <TouchableOpacity 
        style={[styles.diveSiteSelector, { marginTop: DIMENSIONS.SPACE_MD, backgroundColor: COLORS.PRIMARY }]}
        onPress={onAddNewDiveSite}
      >
        <Text style={[styles.diveSiteSelectedText, { flex: 1, textAlign: 'center' }]}>+ Add New Dive Site</Text>
      </TouchableOpacity>

      {/* Dive Site Search Modal */}
      <Modal
        visible={showDiveSiteSearch}
        animationType="slide"
        onRequestClose={() => setShowDiveSiteSearch(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Dive Site</Text>
            <TouchableOpacity onPress={() => {
              setShowDiveSiteSearch(false);
              setDiveSiteSearchQuery('');
            }}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          
          {/* Search Input */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.diveSiteSearchInput}
              placeholder="Search dive sites..."
              placeholderTextColor={COLORS.TEXT_TERTIARY}
              value={diveSiteSearchQuery}
              onChangeText={setDiveSiteSearchQuery}
            />
          </View>
          
          <FlatList
            data={filteredDiveSites}
            keyExtractor={(item) => item.id}
            renderItem={renderDiveSiteItem}
            style={styles.diveSiteList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No dive sites found</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: DIMENSIONS.SPACE_XL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_MD,
  },
  diveSiteSelector: {
    borderWidth: 1,
    borderColor: COLORS.BORDER_PRIMARY,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.SPACE_LG,
    backgroundColor: COLORS.SURFACE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diveSiteSelectorText: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_PRIMARY,
  },
  diveSiteSelectorIcon: {
    color: COLORS.PRIMARY,
  },
  diveSitePlaceholderText: {
    color: COLORS.TEXT_TERTIARY,
  },
  diveSiteSelectedText: {
    color: COLORS.TEXT_PRIMARY,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DIMENSIONS.PADDING_HORIZONTAL,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER_PRIMARY,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    color: COLORS.PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
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
  emptyState: {
    padding: DIMENSIONS.SPACE_LG,
    alignItems: 'center',
  },
  emptyStateText: {
    color: COLORS.TEXT_TERTIARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
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
});

export default DiveSiteSelector;