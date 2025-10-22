import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ROUTES } from '@/constants';
import { Trophy, Fish, Star } from 'lucide-react-native';
import { COLORS } from '@/constants';
import { TYPOGRAPHY } from '@/constants';

interface StatsSectionProps {
  uniqueCreatures?: number;
  totalPoints?: number;
  achievementsUnlocked?: number;
  totalAchievements?: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({ 
  uniqueCreatures = 0,
  totalPoints = 0,
  achievementsUnlocked = 0,
  totalAchievements = 0
}) => {
  const router = useRouter();

  const statsData = [
    {
      id: 'points',
      value: totalPoints,
      label: 'Points',
      icon: <Star size={24} color={COLORS.SECONDARY} />,
      route: ROUTES.STATS.POINTS,
      color: COLORS.SECONDARY
    },
    {
      id: 'species',
      value: uniqueCreatures,
      label: 'Species',
      icon: <Fish size={24} color={COLORS.PRIMARY} />,
      route: ROUTES.STATS.DISCOVERED,
      color: COLORS.PRIMARY
    },
    {
      id: 'achievements',
      value: achievementsUnlocked,
      label: 'Trophies',
      icon: <Trophy size={24} color={COLORS.SUCCESS} />,
      route: ROUTES.STATS.ACHIEVEMENTS,
      color: COLORS.SUCCESS
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Stats</Text>
      <View style={styles.statsContainer}>
        {statsData.map((stat) => (
          <TouchableOpacity 
            key={stat.id}
            style={styles.statItem}
            onPress={() => router.push(stat.route)}
          >
            <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
              {stat.icon}
            </View>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel} numberOfLines={1} ellipsizeMode="tail">{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: TYPOGRAPHY.SIZE_XL,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.SIZE_MD,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
});

export default StatsSection;