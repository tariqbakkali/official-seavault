import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import { AchievementCard } from '@/components';
import { COLORS } from '@/constants';
import { ROUTES } from '@/constants';

interface AchievementsPreviewProps {
  achievements: any[];
  unlockedCount: number;
  totalCount: number;
}

const AchievementsPreview: React.FC<AchievementsPreviewProps> = ({ 
  achievements, 
  unlockedCount,
  totalCount
}) => {
  const router = useRouter();
  
  // Show only unlocked achievements, limit to 3
  const unlockedAchievements = achievements
    .filter(achievement => achievement.unlocked)
    .slice(0, 3);

  const renderAchievement = ({ item }: { item: any }) => (
    <AchievementCard 
      achievement={item} 
      unlocked={item.unlocked}
      progress={item.progress}
      total={item.total}
      variant="home" // Use compact variant for preview
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Trophy size={24} color={COLORS.SECONDARY} />
          <Text style={styles.sectionTitle}>Achievements</Text>
        </View>
        <Text style={styles.counter}>
          {unlockedCount}/{totalCount}
        </Text>
      </View>
      
      {unlockedAchievements.length > 0 ? (
        <FlatList
          data={unlockedAchievements}
          renderItem={renderAchievement}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No achievements unlocked yet</Text>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.viewAllButton}
        onPress={() => router.push(ROUTES.STATS.ACHIEVEMENTS)}
      >
        <Text style={styles.viewAllText}>View All Achievements</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT_PRIMARY,
  },
  counter: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
  },
  viewAllButton: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  viewAllText: {
    color: COLORS.PRIMARY,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AchievementsPreview;