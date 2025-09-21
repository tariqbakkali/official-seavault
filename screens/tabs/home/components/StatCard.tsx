import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Eye, Heart, Trophy } from 'lucide-react-native';

interface StatCardProps {
  type: 'discovered' | 'wishlist' | 'points';
  value: number;
  onPress?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ type, value, onPress }) => {
  const getIcon = () => {
    switch (type) {
      case 'discovered':
        return <Eye size={24} color="#007AFF" />;
      case 'wishlist':
        return <Heart size={24} color="#FF3B30" />;
      case 'points':
        return <Trophy size={24} color="#FF9500" />;
      default:
        return <Eye size={24} color="#007AFF" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'discovered':
        return '#007AFF';
      case 'wishlist':
        return '#FF3B30';
      case 'points':
        return '#FF9500';
      default:
        return '#007AFF';
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
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      {getIcon()}
      <Text style={[styles.statValue, { color: getColor() }]}>{value}</Text>
      <Text style={styles.statLabel}>{getLabel()}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default StatCard;