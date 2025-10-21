import * as React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Trophy, Filter } from 'lucide-react-native';
import { useSyncedData } from '@/hooks/useSyncedData';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { AchievementCard } from '@/components';
import { COLORS } from '@/constants';
import { TYPOGRAPHY } from '@/constants';

export default function AchievementsScreen() {
  const [achievementsWithStatus, setAchievementsWithStatus] = React.useState<any[]>([]);
  const [filteredAchievements, setFilteredAchievements] = React.useState<any[]>([]);
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'unlocked' | 'locked'>('all');
  const insets = useSafeAreaInsets();
  const { id: selectedAchievementId } = useLocalSearchParams();
  
  const { achievements: allAchievements, userAchievements: allUserAchievements, currentUserSightings, creatures } = useSyncedData();

  React.useEffect(() => {
    const loadData = () => {
      try {
        // Get unlocked achievements
        const userAchievementsArray = allUserAchievements ? Object.values(allUserAchievements) : [];
        const unlockedAchievementIds = new Set(userAchievementsArray.map((ua: any) => ua.achievement_id));
        
        // Create a map for quick creature lookup
        const creaturesMap = new Map(
          (creatures ? Object.values(creatures) : []).map((creature: any) => [creature.id, creature])
        );

        // Calculate progress for collection and beginner achievements
        const sightingsArray = currentUserSightings ? Object.values(currentUserSightings) : [];
        const uniqueCreatureIdsSighted = new Set(sightingsArray.map((s: any) => s.creature_id));
        const uniqueCreatures = uniqueCreatureIdsSighted.size;

        // Get unique creature names and classes from sighted creatures for rare achievements
        const sightedCreatureNames = new Set<string>();
        const sightedCreatureClasses = new Set<string>();
        uniqueCreatureIdsSighted.forEach(creatureId => {
          const creature = creaturesMap.get(creatureId);
          if (creature) {
            sightedCreatureNames.add(creature.name);
            sightedCreatureClasses.add(creature.class);
          }
        });
        
        // Get all achievements with unlock status and progress
        const achievementsWithStatus = (allAchievements ? Object.values(allAchievements) : [])
          .map((achievement: any) => {
            let progress = 0;
            let total = 0;
            
            if (achievement.category === 'collection' || achievement.category === 'beginner') {
              progress = uniqueCreatures;
              if (achievement.code === 'first_catch') {
                total = 1;
              } else {
                const match = achievement.description?.match(/Log (\d+) different species/);
                total = match ? parseInt(match[1], 10) : 0;
              }
            } else if (achievement.category === 'rare') {
              total = 1; // Rare achievements are typically "log one of X"
              switch (achievement.code) {
                case 'whale_watcher':
                  progress = Array.from(sightedCreatureNames).some(name => name.toLowerCase().includes('whale')) ? 1 : 0;
                  break;
                case 'dolphin_friend':
                  progress = Array.from(sightedCreatureNames).some(name => name.toLowerCase().includes('dolphin')) ? 1 : 0;
                  break;
                case 'manta_mania':
                  progress = Array.from(sightedCreatureNames).some(name => name.toLowerCase().includes('manta ray')) ? 1 : 0;
                  break;
                case 'shark_whisperer':
                  progress = Array.from(sightedCreatureNames).some(name => name.toLowerCase().includes('shark')) ? 1 : 0;
                  break;
                case 'elusive_spotter':
                  progress = sightedCreatureClasses.has('Rare') ? 1 : 0;
                  break;
                default:
                  // Handle other rare achievements if any, or leave progress as 0
                  break;
              }
            }
            
            const isAlreadyUnlocked = unlockedAchievementIds.has(achievement.id);
            const isCurrentlyMeetingCriteria = (total > 0 && progress >= total);
            const unlocked = isAlreadyUnlocked || isCurrentlyMeetingCriteria;
            
            return {
              ...achievement,
              unlocked: unlocked,
              progress,
              total
            };
          })
          .sort((a: any, b: any) => {
            if (a.unlocked && !b.unlocked) return -1;
            if (!a.unlocked && b.unlocked) return 1;
            return (b.points || 0) - (a.points || 0);
          });

        setAchievementsWithStatus(achievementsWithStatus);
      } catch (error) {
        console.error('Error loading achievements:', error);
      }
    };

    loadData();
  }, [allAchievements, allUserAchievements, currentUserSightings, creatures]);

  // Apply filtering based on active filter
  React.useEffect(() => {
    let filtered = [...achievementsWithStatus];
    
    if (activeFilter === 'unlocked') {
      filtered = filtered.filter(a => a.unlocked);
    } else if (activeFilter === 'locked') {
      filtered = filtered.filter(a => !a.unlocked);
    }
    
    setFilteredAchievements(filtered);
  }, [achievementsWithStatus, activeFilter]);

  const renderAchievement = ({ item }: { item: any }) => (
    <AchievementCard 
      achievement={item} 
      unlocked={item.unlocked}
      progress={item.progress}
      total={item.total}
      onPress={() => {
        // Handle achievement selection if needed

      }}
    />
  );

  const unlockedCount = achievementsWithStatus.filter((a: any) => a.unlocked).length;
  const totalCount = achievementsWithStatus.length;

  return (
    <View style={[styles.container, { 
      paddingTop: insets.top, 
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right
    }]}>
      <ScreenHeader 
        title={`Achievements (${unlockedCount}/${totalCount})`} 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      {/* Filter buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'all' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('all')}
        >
          <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'unlocked' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('unlocked')}
        >
          <Text style={[styles.filterText, activeFilter === 'unlocked' && styles.activeFilterText]}>Unlocked</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, activeFilter === 'locked' && styles.activeFilterButton]}
          onPress={() => setActiveFilter('locked')}
        >
          <Text style={[styles.filterText, activeFilter === 'locked' && styles.activeFilterText]}>Locked</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredAchievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Trophy size={48} color="#666" />
            <Text style={styles.emptyTitle}>No achievements yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete activities to earn achievements
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.SURFACE,
    marginBottom: 10,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: COLORS.SURFACE_SECONDARY,
  },
  activeFilterButton: {
    backgroundColor: COLORS.PRIMARY,
  },
  filterText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: TYPOGRAPHY.SIZE_MD,
    fontWeight: '600',
  },
  activeFilterText: {
    color: COLORS.TEXT_PRIMARY,
  },
  listContainer: {
    paddingHorizontal: 20,
    // Reduce top padding to account for safe area insets and ScreenHeader padding
    paddingTop: 5,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.SIZE_XXL,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});