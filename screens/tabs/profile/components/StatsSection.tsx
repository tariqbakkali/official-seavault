import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsSectionProps {
  stats: any;
}

const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats?.totalPoints || 0}</Text>
        <Text style={styles.statLabel}>Total Points</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats?.uniqueCreatures || 0}</Text>
        <Text style={styles.statLabel}>Species Found</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{Math.round(stats?.overallCompletion || 0)}%</Text>
        <Text style={styles.statLabel}>Completion</Text>
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