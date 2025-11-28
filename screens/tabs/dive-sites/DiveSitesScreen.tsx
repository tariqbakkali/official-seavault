import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSyncedData } from '@/hooks/useSyncedData';
import { formatCoordinate } from '@/utils/diveSiteUtils';
import ScreenHeader from '@/components/ui/ScreenHeader';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorDisplay from '@/components/ErrorDisplay';
import CountryFlag from '@/components/CountryFlag';
import { TYPOGRAPHY, DIMENSIONS } from '@/constants';

/**
 * Comprehensive dive sites screen demonstrating best practices
 */
const DiveSitesScreen = () => {
  const { diveSites, isLoading, errors } = useSyncedData();

  // Extract the actual data from the observable
  // The Legend State observable returns an object with keys as IDs and values as the actual data
  const diveSitesData = React.useMemo(() => {
    if (!diveSites) return [];

    // If diveSites is an object with ID keys, extract the values
    if (typeof diveSites === 'object' && !Array.isArray(diveSites)) {
      return Object.values(diveSites).filter(site => site !== null && site !== undefined);
    }

    // If it's already an array, return as is
    if (Array.isArray(diveSites)) {
      return diveSites;
    }

    return [];
  }, [diveSites]);

  const renderDiveSite = ({ item }: { item: any }) => (
    <View style={styles.siteCard}>
      <View style={styles.headerRow}>
        <CountryFlag latitude={item.latitude} longitude={item.longitude} />
        <Text style={styles.siteName}>{item.name}</Text>
      </View>
      <Text style={styles.coordinates}>
        Lat: {formatCoordinate(item.latitude)} | Lng: {formatCoordinate(item.longitude)}
      </Text>
    </View>
  );

  if (isLoading.diveSites) {
    return <LoadingScreen variant="fullscreen" message="Loading dive sites..." />;
  }

  // Convert error observable to string if needed
  const errorMessage = typeof errors.diveSites === 'object' && errors.diveSites !== null ?
    JSON.stringify(errors.diveSites) :
    errors.diveSites;

  if (errorMessage) {
    return (
      <ErrorDisplay
        message={String(errorMessage)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Dive Sites" />

      {diveSitesData && diveSitesData.length > 0 ? (
        <FlatList
          data={diveSitesData}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderDiveSite}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No dive sites found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContainer: {
    padding: DIMENSIONS.PADDING_LG,
  },
  siteCard: {
    backgroundColor: '#1a1a1a',
    padding: DIMENSIONS.PADDING_MD,
    borderRadius: 8,
    marginBottom: DIMENSIONS.MARGIN_MD,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.MARGIN_XS,
  },
  siteName: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: DIMENSIONS.MARGIN_XS,
  },
  coordinates: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#999',
  },
});

export default DiveSitesScreen;