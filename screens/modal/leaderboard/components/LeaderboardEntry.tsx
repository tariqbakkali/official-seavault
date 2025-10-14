import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy } from 'lucide-react-native';
import OfflineImageHandler from '@/components/OfflineImageHandler';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  creatures: number;
  points: number;
  isCurrentUser: boolean;
  rank: number;
}

interface LeaderboardEntryProps {
  entry: LeaderboardUser;
  rank: number;
}

const LeaderboardEntry: React.FC<LeaderboardEntryProps> = ({ entry, rank }) => {
  // Determine rank badge color
  const getRankBadgeStyle = () => {
    switch (rank) {
      case 1:
        return styles.goldBadge;
      case 2:
        return styles.silverBadge;
      case 3:
        return styles.bronzeBadge;
      default:
        return styles.defaultBadge;
    }
  };

  const getRankTextStyle = () => {
    switch (rank) {
      case 1:
        return styles.goldText;
      case 2:
        return styles.silverText;
      case 3:
        return styles.bronzeText;
      default:
        return styles.defaultText;
    }
  };

  return (
    <View 
      style={[
        styles.leaderboardEntry,
        entry.isCurrentUser && styles.currentUserEntry
      ]}
    >
      <View style={styles.leaderboardLeft}>
        <View style={[styles.rankBadge, getRankBadgeStyle()]}>
          <Text style={[styles.rankText, getRankTextStyle()]}>{rank}</Text>
        </View>
        <View style={styles.avatar}>
          <OfflineImageHandler
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
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>{entry.points.toLocaleString()}</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldBadge: {
    backgroundColor: '#FFD700',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  defaultBadge: {
    backgroundColor: '#2a2a2a',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goldText: {
    color: '#000',
  },
  silverText: {
    color: '#000',
  },
  bronzeText: {
    color: '#000',
  },
  defaultText: {
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  youText: {
    color: '#007AFF',
    fontStyle: 'italic',
  },
  leaderboardSubtext: {
    fontSize: 12,
    color: '#666',
  },
  pointsContainer: {
    alignItems: 'flex-end',
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  ptsText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
});

export default LeaderboardEntry;