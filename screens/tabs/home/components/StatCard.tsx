import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Eye, Heart, Trophy } from 'lucide-react-native';
import { COLORS, TYPOGRAPHY } from '@/constants';

interface StatCardProps {
  type: 'discovered' | 'wishlist' | 'points' | 'achievements';
  value: number;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ type, value, onPress }) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;
  
  const handlePressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const getIcon = () => {
    switch (type) {
      case 'discovered':
        return <Eye size={24} color={COLORS.PRIMARY} />;
      case 'wishlist':
        return <Heart size={24} color={COLORS.ERROR} />;
      case 'points':
        return <Trophy size={24} color={COLORS.SECONDARY} />;
      case 'achievements':
        return <Trophy size={24} color={COLORS.SECONDARY} />;
      default:
        return <Eye size={24} color={COLORS.PRIMARY} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'discovered':
        return COLORS.PRIMARY;
      case 'wishlist':
        return COLORS.ERROR;
      case 'points':
        return COLORS.SECONDARY;
      case 'achievements':
        return COLORS.SECONDARY;
      default:
        return COLORS.PRIMARY;
    }
  };

  const getLabel = () => {
    switch (type) {
      case 'discovered':
        return 'Discovered';
      case 'wishlist':
        return 'Wishlist';
      case 'points':
        return 'Points';
      case 'achievements':
        return 'Achievements';
      default:
        return '';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'discovered':
        return 'rgba(0, 122, 255, 0.15)';
      case 'wishlist':
        return 'rgba(255, 59, 48, 0.15)';
      case 'points':
        return 'rgba(255, 149, 0, 0.15)';
      case 'achievements':
        return 'rgba(255, 149, 0, 0.15)';
      default:
        return 'rgba(0, 122, 255, 0.15)';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.statCard, { backgroundColor: getBackgroundColor() }]} 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
        {getIcon()}
      </Animated.View>
      <Text style={[styles.statValue, { color: getColor() }]}>{value}</Text>
      <Text 
        style={styles.statLabel} 
        numberOfLines={1} 
        ellipsizeMode="tail"
      >
        {getLabel()}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statValue: {
    fontSize: TYPOGRAPHY.SIZE_TITLE,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.SIZE_XS,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});

export default StatCard;