import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageWithFallback } from '@/components';

interface CategoryWithStats {
  id: string;
  name: string;
  image_url: string | null;
  seen: number;
  total: number;
  completion: number;
}

interface CategoryCardProps {
  category: CategoryWithStats;
  onPress: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, onPress }: { category: CategoryCardProps['category'], onPress: CategoryCardProps['onPress'] }) => {
  return (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={onPress}
    >
      <ImageWithFallback
        uri={category.image_url}
        style={styles.categoryImage}
        containerStyle={styles.imageContainer}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.categoryOverlay}
      >
        <View style={styles.categoryContent}>
          <Text style={styles.categoryName}>{category.name}</Text>
          <Text style={styles.categorySubtext}>Available Offline</Text>
        </View>
      </LinearGradient>
      <View style={styles.completionBadge}>
        <Text style={styles.completionText}>
          {category.seen}/{category.total}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryCard: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  categoryContent: {
    // Content wrapper for the gradient overlay
  },
  categoryName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  categorySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  completionBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default CategoryCard;