import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useSyncedData } from '@/hooks/useSyncedData';
import { formatCoordinate } from '@/utils/diveSiteUtils';
import ScreenHeader from '@/components/ui/ScreenHeader';
import LoadingState from '@/components/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';
import DiveSiteMarker from '@/components/DiveSiteMarker';

/**
 * Comprehensive dive sites screen demonstrating best practices
 */
const DiveSitesScreen = () => {
  const { diveSites, isLoading, errors } = useSyncedData();

  // Extract the actual data from the observable
  const diveSitesData = diveSites || [];

  const renderDiveSite = ({ item }: { item: any }) => (
    <View style={styles.siteCard}>
      <Text style={styles.siteName}>{item.name}</Text>
      <Text style={styles.coordinates}>
        Lat: {formatCoordinate(item.latitude)} | Lng: {formatCoordinate(item.longitude)}
      </Text>
    </View>
  );

  if (isLoading.diveSites) {
    return <LoadingState message="Loading dive sites..." />;
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
          keyExtractor={(item) => item.id.toString()}
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
    padding: 20,
  },
  siteCard: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  coordinates: {
    fontSize: 14,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default DiveSitesScreen;