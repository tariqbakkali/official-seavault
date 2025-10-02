import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserStats } from '@/services/statsService';

interface StatsSectionProps {
  uniqueCreatures?: number;
  wishlistCount?: number;
  totalPoints?: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({ 
  uniqueCreatures = 0,
  wishlistCount = 0,
  totalPoints = 0
}) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{totalPoints}</Text>
        <Text style={styles.statLabel}>Total Points</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{uniqueCreatures}</Text>
        <Text style={styles.statLabel}>Species Found</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{wishlistCount}</Text>
        <Text style={styles.statLabel}>Wishlist</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default StatsSection;