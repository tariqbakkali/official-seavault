import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CategoryProgressSectionProps {
  stats: any;
}

const CategoryProgressSection: React.FC<CategoryProgressSectionProps> = ({ stats }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Category Progress</Text>
      {Object.entries(stats?.categoryStats || {}).map(([categoryId, stat]: [string, any]) => (
        <View key={categoryId} style={styles.categoryProgress}>
          <View style={styles.categoryProgressHeader}>
            <Text style={styles.categoryName}>{stats?.categoryNames?.[categoryId] || 'Category'}</Text>
            <Text style={styles.categoryCompletion}>{stat.seen}/{stat.total}</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${stat.completion}%` }
              ]} 
            />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  categoryProgress: {
    marginBottom: 16,
  },
  categoryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    color: '#fff',
  },
  categoryCompletion: {
    fontSize: 14,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
});

export default CategoryProgressSection;