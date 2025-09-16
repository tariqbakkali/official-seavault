import { UnlockedAchievement, Achievement, Sighting, Creature } from '@/types/database';
import { getStorageItem, setStorageItem } from './cache';

export class AchievementService {
  private static instance: AchievementService;
  private unlockedAchievements: Set<string> = new Set();

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  async loadUnlockedAchievements(): Promise<void> {
    const stored = await getStorageItem('unlockedAchievements');
    if (stored) {
      const unlocked: UnlockedAchievement[] = JSON.parse(stored);
      this.unlockedAchievements = new Set(unlocked.map(a => a.code));
    }
  }

  async checkAchievements(sightings: Sighting[], creatures: Creature[]): Promise<string[]> {
    const newlyUnlocked: string[] = [];
    const uniqueCreatures = new Set(sightings.map(s => s.creature_id));
    const uniqueCreatureCount = uniqueCreatures.size;

    // Progress-based achievements
    const progressAchievements = [
      { code: 'first_catch', threshold: 1 },
      { code: 'getting_feet_wet', threshold: 5 },
      { code: 'underwater_explorer', threshold: 10 },
      { code: 'marine_enthusiast', threshold: 25 },
      { code: 'ocean_archivist', threshold: 50 },
      { code: 'sea_vault_master', threshold: 100 }
    ];

    for (const achievement of progressAchievements) {
      if (uniqueCreatureCount >= achievement.threshold && !this.unlockedAchievements.has(achievement.code)) {
        newlyUnlocked.push(achievement.code);
        this.unlockedAchievements.add(achievement.code);
      }
    }

    // Category-specific achievements
    const categoryAchievements = [
      { code: 'shark_whisperer', categoryName: 'Sharks' },
      { code: 'dolphin_friend', creatureName: 'Dolphin' },
      { code: 'whale_watcher', creatureName: 'Whale' },
      { code: 'manta_mania', creatureName: 'Manta' }
    ];

    for (const achievement of categoryAchievements) {
      if (this.unlockedAchievements.has(achievement.code)) continue;

      const hasAchievement = sightings.some(sighting => {
        const creature = creatures.find(c => c.id === sighting.creature_id);
        if (!creature) return false;

        if (achievement.categoryName) {
          // Find category by name (would need category data)
          return false; // Simplified for now
        }

        if (achievement.creatureName) {
          return creature.name.toLowerCase().includes(achievement.creatureName.toLowerCase());
        }

        return false;
      });

      if (hasAchievement) {
        newlyUnlocked.push(achievement.code);
        this.unlockedAchievements.add(achievement.code);
      }
    }

    // Rare species achievement
    if (!this.unlockedAchievements.has('elusive_spotter')) {
      const hasRareSpotting = sightings.some(sighting => {
        const creature = creatures.find(c => c.id === sighting.creature_id);
        return creature?.class?.toLowerCase() === 'rare';
      });

      if (hasRareSpotting) {
        newlyUnlocked.push('elusive_spotter');
        this.unlockedAchievements.add('elusive_spotter');
      }
    }

    // Save updated achievements
    if (newlyUnlocked.length > 0) {
      await this.saveUnlockedAchievements();
    }

    return newlyUnlocked;
  }

  private async saveUnlockedAchievements(): Promise<void> {
    const unlocked: UnlockedAchievement[] = Array.from(this.unlockedAchievements).map(code => ({
      code,
      unlockedAt: new Date().toISOString()
    }));
    await setStorageItem('unlockedAchievements', JSON.stringify(unlocked));
  }

  getUnlockedAchievements(): string[] {
    return Array.from(this.unlockedAchievements);
  }

  getAchievementProgress(code: string, sightings: Sighting[]): { current: number; target: number } {
    const uniqueCount = new Set(sightings.map(s => s.creature_id)).size;

    const progressAchievements: Record<string, number> = {
      'first_catch': 1,
      'getting_feet_wet': 5,
      'underwater_explorer': 10,
      'marine_enthusiast': 25,
      'ocean_archivist': 50,
      'sea_vault_master': 100
    };

    const target = progressAchievements[code];
    if (target) {
      return { current: Math.min(uniqueCount, target), target };
    }

    return { current: this.unlockedAchievements.has(code) ? 1 : 0, target: 1 };
  }
}

export const achievementService = AchievementService.getInstance();