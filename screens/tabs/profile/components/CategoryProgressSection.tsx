import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants';

interface CategoryStat {
  seen: number;
  total: number;
  completion: number;
}

interface CategoryProgressSectionProps {
  categoryStats?: Record<string, CategoryStat>;
  categoryNames?: Record<string, string>;
}

const CategoryProgressSection: React.FC<CategoryProgressSectionProps> = ({ 
  categoryStats = {},
  categoryNames = {}
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Category Progress</Text>
      {Object.entries(categoryStats).map(([categoryId, stat]: [string, CategoryStat]) => (
        <View key={categoryId} style={styles.categoryProgress}>
          <View style={styles.categoryProgressHeader}>
            <Text style={styles.categoryName}>{categoryNames[categoryId] || 'Category'}</Text>
            <Text style={styles.categoryCompletion}>{stat.seen}/{stat.total}</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${stat.completion}%`,
                  backgroundColor: stat.completion === 100 ? COLORS.SUCCESS : COLORS.PRIMARY
                }
              ]} 
            />
          </View>
          <Text style={styles.completionText}>{Math.round(stat.completion)}% Complete</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  categoryProgress: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  categoryCompletion: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.SURFACE_SECONDARY,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionText: {
    fontSize: 12,
    color: COLORS.TEXT_TERTIARY,
    textAlign: 'right',
  },
});

export default CategoryProgressSection;