import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { ImageWithFallback } from '@/components';
import { TYPOGRAPHY } from '@/constants';

interface LeaderboardEntryData {
  name: string;
  avatar: string;
  creatures: number;
  points: number;
  isCurrentUser?: boolean;
}

interface LeaderboardEntryProps {
  entry: LeaderboardEntryData;
  rank: number;
}

const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({ entry, rank }: { entry: LeaderboardEntryProps['entry'], rank: LeaderboardEntryProps['rank'] }) => {
  return (
    <View 
      style={[
        styles.leaderboardEntry,
        entry.isCurrentUser && styles.currentUserEntry
      ]}
    >
      <View style={styles.leaderboardLeft}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={styles.avatar}>
          <ImageWithFallback
            uri={entry.avatar}
            style={styles.avatarImage}
            fallbackColor="#333"
          />
        </View>
        <View>
          <Text style={styles.leaderboardName}>
            {entry.name}
            {entry.isCurrentUser && <Text style={styles.youText}></Text>}
          </Text>
          <Text style={styles.leaderboardSubtext}>
            {entry.creatures} creatures discovered
          </Text>
        </View>
      </View>
      <View style={styles.pointsBadge}>
        <Text style={styles.pointsText}>{entry.points}</Text>
        <Text style={styles.ptsText}>PTS</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  leaderboardEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  currentUserEntry: {
    backgroundColor: '#003366',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  leaderboardName: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: '600',
    color: '#fff',
  },
  youText: {
    color: '#007AFF',
    fontStyle: 'italic',
  },
  leaderboardSubtext: {
    fontSize: TYPOGRAPHY.SIZE_SM,
    color: '#666',
  },
  pointsBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 64,
  },
  pointsText: {
    fontSize: TYPOGRAPHY.SIZE_LG,
    fontWeight: 'bold',
    color: '#fff',
  },
  ptsText: {
    fontSize: TYPOGRAPHY.SIZE_XS,
    color: '#fff',
    opacity: 0.8,
  },
});

export default LeaderboardEntry;