import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ImageWithFallback } from '@/components';
import { DIMENSIONS, COLORS, TYPOGRAPHY } from '@/constants';
import { Creature } from '@/types/database';

interface ExploreCreatureCardProps {
  creature: Creature & {
    isDiscovered?: boolean;
    category?: string;
  };
  onPress: () => void;
}

const ExploreCreatureCard: React.FC<ExploreCreatureCardProps> = ({ creature, onPress }: { creature: ExploreCreatureCardProps['creature'], onPress: ExploreCreatureCardProps['onPress'] }) => {
  // For now, we'll just display the card without the discovered status
  // In a real implementation, we would check if the user has discovered this creature
  const isDiscovered = creature.isDiscovered || false;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <ImageWithFallback
          uri={creature.image_url || ''}
          style={styles.image}
          fallbackColor={COLORS.SURFACE_SECONDARY}
        />
        {isDiscovered && (
          <View style={styles.discoveredBadge}>
            <Text style={styles.discoveredText}>✓</Text>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {creature.name}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {creature.category || 'Unknown'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: DIMENSIONS.SCREEN_WIDTH * 0.4,
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_LG,
    overflow: 'hidden',
    margin: DIMENSIONS.SPACE_SM,
  },
  imageContainer: {
    width: '100%',
    height: DIMENSIONS.SCREEN_WIDTH * 0.4,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  discoveredBadge: {
    position: 'absolute',
    top: DIMENSIONS.SPACE_SM,
    right: DIMENSIONS.SPACE_SM,
    backgroundColor: COLORS.SUCCESS,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  discoveredText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: TYPOGRAPHY.WEIGHT_BOLD,
  },
  content: {
    padding: DIMENSIONS.SPACE_MD,
  },
  name: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: TYPOGRAPHY.WEIGHT_SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  category: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: COLORS.TEXT_TERTIARY,
  },
});

export default ExploreCreatureCard;