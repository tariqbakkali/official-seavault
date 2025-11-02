import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Trophy, 
  Fish, 
  Medal, 
  Star, 
  Heart, 
  Swords,
  Award,
  Crown,
  Target,
  Shield,
  Sparkles,
  Gem,
  // Removed Whale as it's not available in lucide-react-native
} from 'lucide-react-native';
import { Achievement } from '@/types/database';
import { TYPOGRAPHY, DIMENSIONS, COLORS } from '@/constants';

interface AchievementCardProps {
  achievement: Achievement;
  unlocked: boolean;
  progress?: number; // For progress-based achievements
  total?: number;    // For progress-based achievements
  onPress?: () => void;
  variant?: 'default' | 'home'; // Added variant prop for home screen styling
}

// Map icon names to actual components
const iconMap: Record<string, React.ComponentType<{ color?: string; size?: number }>> = {
  'Trophy': Trophy,
  'Fish': Fish,
  'Medal': Medal,
  'Star': Star,
  'Heart': Heart,
  'Swords': Swords,
  // Removed 'Whale': Whale, as it's not available
  'Award': Award,
  'Crown': Crown,
  'Target': Target,
  'Shield': Shield,
  'Sparkles': Sparkles,
  'Gem': Gem,
};

const AchievementCard: React.FC<AchievementCardProps> = ({ 
  achievement, 
  unlocked, 
  progress, 
  total,
  onPress,
  variant = 'default' // Default to 'default' variant
}) => {
  // Get the appropriate icon component or default to Trophy
  const IconComponent = iconMap[achievement.icon_name || 'Trophy'] || Trophy;
  
  // Determine category color
  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case 'beginner': return '#4DA6FF';
      case 'collection': return '#FF9500';
      case 'rare': return '#FF3B30';
      default: return COLORS.SECONDARY;
    }
  };
  
  const categoryColor = getCategoryColor(achievement.category);
  
  // Home screen specific styles
  if (variant === 'home') {
    return (
      <TouchableOpacity 
        style={[homeStyles.container, !unlocked && homeStyles.locked]} 
        onPress={onPress} 
        disabled={!onPress}
        activeOpacity={0.7}
      >
        <View style={[homeStyles.iconContainer, { backgroundColor: unlocked ? `${categoryColor}20` : COLORS.SURFACE_SECONDARY }]}>
          <IconComponent 
            size={20} 
            color={unlocked ? categoryColor : COLORS.TEXT_DISABLED} 
          />
        </View>
        
        <View style={homeStyles.content}>
          <Text style={[homeStyles.name, !unlocked && homeStyles.lockedText]} numberOfLines={1}>
            {achievement.name}
          </Text>
          
          {/* Simplified progress display for home screen */}
          {progress !== undefined && total !== undefined && progress < total && (
            <View style={homeStyles.progressBarContainer}>
              <View style={homeStyles.progressBarBackground}>
                <View 
                  style={[
                    homeStyles.progressBarFill, 
                    { 
                      width: `${(progress / (total || 1)) * 100}%`,
                      backgroundColor: categoryColor
                    }
                  ]} 
                />
              </View>
              <Text style={[homeStyles.progressText, !unlocked && homeStyles.lockedText]}>
                {progress}/{total}
              </Text>
            </View>
          )}
          
          {progress !== undefined && total !== undefined && progress >= total && (
            <View style={homeStyles.completedContainer}>
              <Text style={homeStyles.completedText}>Completed</Text>
            </View>
          )}
        </View>
        
        <View style={homeStyles.pointsContainer}>
          <Text style={[homeStyles.points, { color: categoryColor }]}>
            {achievement.points} pts
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
  
  // Default variant (existing implementation)
  return (
    <TouchableOpacity 
      style={[styles.container, !unlocked && styles.locked]} 
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { borderColor: categoryColor }]}>
        <IconComponent 
          size={24} 
          color={unlocked ? categoryColor : COLORS.TEXT_DISABLED} 
        />
      </View>
      
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, !unlocked && styles.lockedText]} numberOfLines={1}>
            {achievement.name}
          </Text>
          <View style={[styles.pointsContainer, { backgroundColor: `${categoryColor}20` }]}>
            <Text style={[styles.points, { color: categoryColor }]}>
              {achievement.points} pts
            </Text>
          </View>
        </View>
        
        <Text style={[styles.description, !unlocked && styles.lockedText]} numberOfLines={2}>
          {achievement.description}
        </Text>
        
        {/* Progress display - simplified for completed achievements */}
        {progress !== undefined && total !== undefined && (
          progress >= total ? (
         <></>
          ) : (
            // For in-progress achievements, show the progress bar
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${(progress / (total || 1)) * 100}%`,
                      backgroundColor: categoryColor
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.progressText, !unlocked && styles.lockedText]}>
                {progress}/{total}
              </Text>
            </View>
          )
        )}
        
        <View style={styles.bottomRow}>
          <View style={[styles.categoryBadge, { backgroundColor: `${categoryColor}20` }]}>
            <Text style={[styles.categoryText, { color: categoryColor }]}>
              {achievement.category}
            </Text>
          </View>
          
          {unlocked && (
            <View style={styles.unlockedBadge}>
              <Text style={styles.unlockedText}>UNLOCKED</Text>
            </View>
          )}
        </View>
      </View>
      
      {!unlocked && (
        <View style={styles.lockOverlay}>
          <View style={styles.lockIconContainer}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Home screen specific styles
const homeStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_MD,
    padding: DIMENSIONS.PADDING_MD,
    marginBottom: DIMENSIONS.SPACE_SM,
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.SECONDARY,
  },
  locked: {
    opacity: 0.7,
    borderLeftColor: COLORS.TEXT_DISABLED,
  },
  iconContainer: {
    width: DIMENSIONS.PADDING_40,
    height: DIMENSIONS.PADDING_40,
    borderRadius: DIMENSIONS.RADIUS_XL,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACE_XL
  },
  content: {
    flex: 1,
  },
  name: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.SURFACE_SECONDARY,
    borderRadius: DIMENSIONS.RADIUS_XS,
    overflow: 'hidden',
    marginRight: DIMENSIONS.SPACE_SM,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: DIMENSIONS.RADIUS_XS,
  },
  progressText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_XS,
    fontWeight: '600',
  },
  completedContainer: {
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  completedText: {
    color: COLORS.SUCCESS,
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: '600',
  },
  pointsContainer: {
    paddingHorizontal: DIMENSIONS.PADDING_SM,
    paddingVertical: DIMENSIONS.PADDING_XS,
  },
  points: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: '700',
  },
  lockedText: {
    color: COLORS.TEXT_DISABLED,
  },
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.SURFACE,
    borderRadius: DIMENSIONS.RADIUS_LG,
    padding: DIMENSIONS.PADDING_LG,
    marginBottom: DIMENSIONS.SPACE_LG,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SECONDARY,
  },
  locked: {
    opacity: 0.8,
    borderLeftColor: COLORS.TEXT_DISABLED,
  },
  iconContainer: {
    width: DIMENSIONS.ICON_XL,
    height: DIMENSIONS.ICON_XL,
    borderRadius: DIMENSIONS.RADIUS_XL,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.SPACE_XL,
    borderWidth: DIMENSIONS.SPACE_XS,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DIMENSIONS.SPACE_XS,
  },
  name: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: '700',
    flex: 1,
    marginRight: DIMENSIONS.SPACE_SM,
  },
  description: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    marginBottom: DIMENSIONS.SPACE_LG,
    lineHeight: 20,
  },
  completedContainer: {
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  completedText: {
    color: COLORS.SUCCESS,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DIMENSIONS.SPACE_LG,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.SURFACE_SECONDARY,
    borderRadius: DIMENSIONS.RADIUS_XS,
    overflow: 'hidden',
    marginRight: DIMENSIONS.SPACE_SM,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: DIMENSIONS.RADIUS_XS,
  },
  progressText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    paddingVertical: DIMENSIONS.PADDING_XS,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pointsContainer: {
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    paddingVertical: DIMENSIONS.PADDING_XS,
  },
  points: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: '700',
  },
  unlockedBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    borderRadius: DIMENSIONS.RADIUS_MD,
    paddingHorizontal: DIMENSIONS.PADDING_MD,
    paddingVertical: DIMENSIONS.PADDING_XS,
  },
  unlockedText: {
    color: COLORS.SUCCESS,
    fontSize: TYPOGRAPHY.SIZE_SM,
    fontWeight: '700',
  },
  lockedText: {
    color: COLORS.TEXT_DISABLED,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: DIMENSIONS.RADIUS_LG,
  },
  lockIconContainer: {
    width: DIMENSIONS.ICON_XL,
    height: DIMENSIONS.ICON_XL,
    borderRadius: DIMENSIONS.RADIUS_LG,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', 
    alignItems: 'center'
  },
  lockIcon: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
  },
});

export default AchievementCard;