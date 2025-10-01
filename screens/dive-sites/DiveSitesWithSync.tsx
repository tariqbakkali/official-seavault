import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useSyncedData } from '@/hooks/useSyncedData';

// Utility function to extract actual values from observable objects
const extractObservableValues = (obj: any): any => {
  if (!obj) return obj;
  
  // If it's an observable with a get method, return its value
  if (typeof obj === 'object' && obj.get && typeof obj.get === 'function') {
    return obj.get();
  }
  
  // If it's an object, recursively extract values
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = extractObservableValues(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
};

const DiveSitesWithSync: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { diveSites } = useSyncedData();
  
  // Convert dive sites object to array with actual values
  const diveSitesArray = diveSites ? 
    Object.values(diveSites).map(site => extractObservableValues(site)) : [];

  const onRefresh = async () => {
    setRefreshing(true);
    // In a real implementation, we might want to force a sync
    // For now, we'll just wait a bit to simulate refreshing
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderDiveSite = ({ item }: { item: any }) => (
    <View style={styles.diveSiteItem}>
      <Text style={styles.diveSiteName}>{item.name}</Text>
      {item.latitude && item.longitude && (
        <Text style={styles.coordinates}>
          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );

  if (!diveSites) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dive sites...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={diveSitesArray}
        renderItem={renderDiveSite}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={
          <Text style={styles.header}>Dive Sites ({diveSitesArray.length})</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  diveSiteItem: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  diveSiteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  coordinates: {
    fontSize: 14,
    color: '#666',
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default DiveSitesWithSync;