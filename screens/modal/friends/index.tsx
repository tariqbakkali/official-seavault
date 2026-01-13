import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, UserPlus, Check, X, Users, User, Clock } from 'lucide-react-native';
import { useSyncedData } from '@/hooks/useSyncedData';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { COLORS, TYPOGRAPHY, DIMENSIONS } from '@/constants';
import { searchUsers, sendFriendRequest, getFriendRequests, respondToFriendRequest, getFriends, removeFriend, getFriendsProfiles } from '@/services/friendsService';
import { Profile } from '@/types/database';

type Tab = 'friends' | 'requests';

export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { profile, allProfiles, friends: friendsStore } = useSyncedData();
  const userProfile = profile ? Object.values(profile)[0] : null;
  const currentUserId = userProfile?.id;

  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Derive data from synced store
  const { myFriends, incomingRequests, outgoingRequests } = React.useMemo(() => {
    if (!currentUserId || !friendsStore) return { myFriends: [], incomingRequests: [], outgoingRequests: [] };

    const allFriends = Object.values(friendsStore);
    
    // My Friends (Accepted)
    const friendsList = allFriends
      .filter(f => (f.user_id === currentUserId || f.friend_id === currentUserId) && f.status === 'accepted')
      .map(f => {
        const otherId = f.user_id === currentUserId ? f.friend_id : f.user_id;
        const otherProfile = allProfiles?.[otherId];
        return otherProfile || { id: otherId, full_name: 'Unknown User' };
      });

    // Incoming Requests (Pending, sent to me)
    const incoming = allFriends
      .filter(f => f.friend_id === currentUserId && f.status === 'pending')
      .map(f => ({
        ...f,
        from_profile: allProfiles?.[f.user_id]
      }));

    // Outgoing Requests (Pending, sent by me)
    const outgoing = allFriends
      .filter(f => f.user_id === currentUserId && f.status === 'pending')
      .map(f => ({
        ...f,
        to_profile: allProfiles?.[f.friend_id]
      }));

    return { myFriends: friendsList, incomingRequests: incoming, outgoingRequests: outgoing };
  }, [friendsStore, allProfiles, currentUserId]);

  const handleSearch = async () => {
    if (!currentUserId || searchQuery.length < 2) return;
    setIsSearching(true);
    try {
      const results = await searchUsers(searchQuery, currentUserId);
      setSearchResults(results || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    if (!currentUserId) return;
    try {
      const { error } = await sendFriendRequest(currentUserId, targetId);
      if (error) {
          if (error === 'Friend request already exists') {
               Alert.alert('Info', 'Friend request already sent or exists.');
          } else {
               Alert.alert('Error', 'Failed to send friend request.');
          }
      } else {
        // UI updates automatically via sync
        Alert.alert('Success', 'Friend request sent!');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred.');
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const { error } = await respondToFriendRequest(requestId, 'accepted');
      if (error) throw error;
      // UI updates automatically via sync
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request.');
    }
  };

  const handleReject = async (requestId: string) => {
    try {
       const { error } = await respondToFriendRequest(requestId, 'blocked');
       if (error) throw error;
       // UI updates automatically via sync
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request.');
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUserId) return;
    Alert.alert(
        "Remove Friend",
        "Are you sure you want to remove this friend?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Remove", style: "destructive", onPress: async () => {
                const { error } = await removeFriend(currentUserId, friendId);
                if (error) {
                    Alert.alert('Error', 'Failed to remove friend.');
                }
                // UI updates automatically via sync
            }}
        ]
    );
  };

  const renderSearchResult = ({ item }: { item: any }) => {
    // Check status
    const isFriend = myFriends.some(f => f.id === item.id);
    const hasOutgoingRequest = outgoingRequests.some(r => r.friend_id === item.id);
    const hasIncomingRequest = incomingRequests.some(r => r.user_id === item.id);

    return (
      <View style={styles.userCard}>
        <Image 
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }} 
          style={styles.avatar} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name || 'Unknown User'}</Text>
          <Text style={styles.userSubtext}>Diver</Text>
        </View>

        {isFriend ? (
          <View style={styles.pendingTag}>
            <Check size={14} color={COLORS.SUCCESS} />
            <Text style={[styles.pendingText, { color: COLORS.SUCCESS }]}>Friend</Text>
          </View>
        ) : hasOutgoingRequest ? (
          <View style={styles.pendingTag}>
            <Clock size={14} color="#8E8E93" />
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        ) : hasIncomingRequest ? (
          <TouchableOpacity 
            style={[styles.actionButton, styles.acceptButton]} 
            onPress={() => handleAccept(incomingRequests.find(r => r.user_id === item.id)?.id || '')}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.addButton}
            onPress={async () => {
              await handleSendRequest(item.id);
            }}
          >
            <UserPlus size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderFriend = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <Image 
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/50' }} 
        style={styles.avatar} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name || 'Unknown User'}</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveFriend(item.id)}
      >
        <X size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const renderRequest = ({ item, type }: { item: any, type: 'incoming' | 'outgoing' }) => {
     const otherUser = type === 'incoming' ? item.from_profile : item.to_profile;
     return (
        <View style={styles.userCard}>
        <Image 
            source={{ uri: otherUser?.avatar_url || 'https://via.placeholder.com/50' }} 
            style={styles.avatar} 
        />
        <View style={styles.userInfo}>
            <Text style={styles.userName}>{otherUser?.full_name || 'Unknown User'}</Text>
            <Text style={styles.userSubtext}>{type === 'incoming' ? 'Sent you a request' : 'Request sent'}</Text>
        </View>
        {type === 'incoming' ? (
            <View style={styles.actionButtons}>
            <TouchableOpacity 
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAccept(item.id)}
            >
                <Check size={16} color="#FFF" />
                <Text style={styles.actionButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item.id)}
            >
                <X size={16} color="#FFF" />
            </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.pendingTag}>
                <Clock size={14} color="#8E8E93" />
                <Text style={styles.pendingText}>Pending</Text>
            </View>
        )}
        </View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom, paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
      <ScreenHeader 
        title="Friends" 
        onBackPress={() => router.back()}
        showBackButton={true}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
            <Search size={20} color="#8E8E93" />
            <TextInput
                style={styles.searchInput}
                placeholder="Search users..."
                placeholderTextColor="#8E8E93"
                value={searchQuery}
                onChangeText={(text) => {
                    setSearchQuery(text);
                    if (text.length === 0) {
                        setSearchResults([]);
                    }
                }}
                onSubmitEditing={handleSearch}
                returnKeyType="search"
            />
        </View>
      </View>

      {searchQuery.length > 0 ? (
        <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                    {isSearching ? (
                        <ActivityIndicator color={COLORS.PRIMARY} />
                    ) : (
                        <Text style={styles.emptyText}>No users found.</Text>
                    )}
                </View>
            )}
        />
      ) : (
        <>
            <View style={styles.tabs}>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
                    onPress={() => setActiveTab('friends')}
                >
                    <Users size={20} color={activeTab === 'friends' ? '#FFF' : '#8E8E93'} />
                    <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>My Friends</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                    onPress={() => setActiveTab('requests')}
                >
                    <User size={20} color={activeTab === 'requests' ? '#FFF' : '#8E8E93'} />
                    <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Requests</Text>
                    {(incomingRequests.length > 0) && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{incomingRequests.length}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <FlatList
                data={(activeTab === 'friends' ? myFriends : [...incomingRequests, ...outgoingRequests]) as any[]}
                renderItem={({ item }) => activeTab === 'friends' ? renderFriend({ item }) : renderRequest({ item, type: incomingRequests.includes(item) ? 'incoming' : 'outgoing' })}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {activeTab === 'friends' ? 'No friends yet. Search to add some!' : 'No pending requests.'}
                        </Text>
                    </View>
                )}
            />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    padding: DIMENSIONS.PADDING_MD,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: '#FFF',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.PRIMARY,
  },
  tabText: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFF',
  },
  badge: {
    backgroundColor: COLORS.ERROR,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContent: {
    padding: DIMENSIONS.PADDING_MD,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userSubtext: {
    color: '#8E8E93',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: 8,
    borderRadius: 20,
  },
  removeButton: {
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  rejectButton: {
    backgroundColor: '#333',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pendingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  }
});
