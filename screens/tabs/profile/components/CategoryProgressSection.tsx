import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';

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
    marginHorizontal: DIMENSIONS.MARGIN_LG,
    marginBottom: DIMENSIONS.MARGIN_XL,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.MARGIN_LG,
  },
  categoryProgress: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.MARGIN_MD,
  },
  categoryProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
    color: COLORS.TEXT_PRIMARY,
  },
  categoryCompletion: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: '600',
    color: COLORS.TEXT_SECONDARY,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.SURFACE_SECONDARY,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: DIMENSIONS.MARGIN_SM,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completionText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
    textAlign: 'right',
  },
});

export default CategoryProgressSection;