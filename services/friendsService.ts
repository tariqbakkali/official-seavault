import { supabase } from './supabase';
import { Database } from '@/types/database';
import { allUsersProfiles$, friends$ } from '@/stores/syncedObservables';
import { v4 as uuidv4 } from 'uuid';

type FriendInsert = Database['public']['Tables']['friends']['Insert'];
type FriendUpdate = Database['public']['Tables']['friends']['Update'];

export const getFriends = async (userId: string): Promise<string[]> => {
  try {
    const { data: sentRequests, error: sentError } = await supabase
      .from('friends')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .returns<{ friend_id: string }[]>();

    if (sentError) throw sentError;

    const { data: receivedRequests, error: receivedError } = await supabase
      .from('friends')
      .select('user_id')
      .eq('friend_id', userId)
      .eq('status', 'accepted')
      .returns<{ user_id: string }[]>();

    if (receivedError) throw receivedError;

    const friendIds = [
      ...(sentRequests?.map(f => f.friend_id) || []),
      ...(receivedRequests?.map(f => f.user_id) || [])
    ];

    return [...new Set(friendIds)]; // Remove duplicates just in case
  } catch (error) {
    console.error('Error fetching friends:', error);
    return [];
  }
};

export const getFriendsProfiles = async (userId: string) => {
    const friendIds = await getFriends(userId);
    if (!friendIds.length) return [];

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('id', friendIds);
            
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching friend profiles:', error);
        return [];
    }
};

export interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  profile?: any; // To hold the profile of the other user
}

export const searchUsers = async (query: string, currentUserId: string) => {
  if (!query || query.length < 2) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, membership_tier, email')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', currentUserId)
      .limit(20);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

export const sendFriendRequest = async (currentUserId: string, targetUserId: string) => {
  try {
    // 1. Check if request already exists in observable (optimistic check)
    const existing = Object.values(friends$.get() || {}).find(f => 
      (f.user_id === currentUserId && f.friend_id === targetUserId) ||
      (f.user_id === targetUserId && f.friend_id === currentUserId)
    );

    if (existing) {
        return { error: 'Friend request already exists' };
    }

    const id = uuidv4(); 
    const now = new Date().toISOString();
    
    // 1. Instantly update local observable for snappy UI
    (friends$ as any)[id].set({
        id,
        user_id: currentUserId,
        friend_id: targetUserId,
        status: 'pending',
        created_at: now,
        updated_at: now,
    });

    // 2. Best effort Supabase insert
    try {
        const { error } = await (supabase as any)
            .from('friends')
            .insert({
                id,
                user_id: currentUserId,
                friend_id: targetUserId,
                status: 'pending'
            });

        if (error) {
            if (error.code === '23505') {
                return { error: 'Friend request already sent' };
            }
            throw error;
        }
    } catch (error) {
        console.error('[sendFriendRequest] Supabase call failed:', error);
        // We keep the local state for now; syncFriends will fix it later if it really failed
    }

    return { data: { id } };
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { error };
  }
};

export const getFriendRequests = async (userId: string) => {
  try {
    // Get requests where I am the friend_id (incoming)
    const { data: incoming, error: incomingError } = await supabase
      .from('friends')
      .select(`
        *,
        from_profile:profiles!friends_user_id_fkey(id, full_name, avatar_url)
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (incomingError) throw incomingError;

    // Get requests where I am the user_id (outgoing)
    const { data: outgoing, error: outgoingError } = await supabase
      .from('friends')
      .select(`
        *,
        to_profile:profiles!friends_friend_id_fkey(id, full_name, avatar_url)
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (outgoingError) throw outgoingError;

    return {
        incoming: incoming || [],
        outgoing: outgoing || []
    };
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return { incoming: [], outgoing: [] };
  }
};

export const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'blocked') => {
  try {
    const now = new Date().toISOString();

    // 1. Update local state immediately
    if ((friends$ as any)[requestId]) {
        (friends$ as any)[requestId].assign({ 
            status: status, 
            updated_at: now 
        });
    }

    // 2. Update Supabase
    try {
        const { error } = await (supabase as any)
            .from('friends')
            .update({ status, updated_at: now })
            .eq('id', requestId);

        if (error) throw error;
    } catch (error) {
        console.error('[respondToFriendRequest] Supabase call failed:', error);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error responding to friend request:', error);
    return { error };
  }
};

export const removeFriend = async (userId: string, friendId: string) => {
    try {
        // Find the relationship record locally in the observable
        const friends = friends$.get() || {};
        const friendRecord = Object.values(friends).find(f => 
            (f.user_id === userId && f.friend_id === friendId) || 
            (f.user_id === friendId && f.friend_id === userId)
        );

        if (!friendRecord || !friendRecord.id) {
            console.warn('Friend record not found locally, attempting generic delete');
            const { error: delError } = await (supabase as any)
                .from('friends')
                .delete()
                .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
            
            if (delError) throw delError;
            return { success: true };
        }

        // 1. Remove from local state immediately
        (friends$ as any)[friendRecord.id].delete();

        // 2. Remove from Supabase
        try {
            const { error } = await (supabase as any)
                .from('friends')
                .delete()
                .eq('id', friendRecord.id);

            if (error) throw error;
        } catch (error) {
            console.error('[removeFriend] Supabase call failed:', error);
        }

        return { success: true }; 
    } catch (error) {
        console.error('Error removing friend:', error);
        return { error };
    }
};

export const getFriendshipStatus = async (currentUserId: string, otherUserId: string) => {
    try {
        const { data, error } = await supabase
            .from('friends')
            .select('*')
            .or(`and(user_id.eq.${currentUserId},friend_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},friend_id.eq.${currentUserId})`)
            .maybeSingle();
            
        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error checking friendship status:', error);
        return null;
    }
};

/**
 * Manual sync function to hydrate the friends store from Supabase.
 * This is "The Proper Way" - clear, manual control.
 */
export const syncFriends = async (userId: string) => {
  if (!userId) return;
  
  try {
    console.log('[Sync] Hydrating friends for:', userId);
    const { data, error } = await (supabase as any)
      .from('friends')
      .select('*')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) throw error;

    if (data) {
      const friendsMap: Record<string, any> = {};
      (data as any[]).forEach(item => {
        friendsMap[item.id] = item;
      });
      friends$.set(friendsMap);
      console.log(`[Sync] Hydrated ${data.length} friends`);
      
      // Lazily fetch missing profiles for these friends
      (data as any[]).forEach(item => {
        const otherId = item.user_id === userId ? item.friend_id : item.user_id;
        ensureProfileLoaded(otherId);
      });
    }
  } catch (error) {
    console.error('[Sync] Failed to sync friends:', error);
  }
};

/**
 * Ensures a user's profile is in the allUsersProfiles$ store.
 */
const ensureProfileLoaded = async (userId: string) => {
  if (!userId) return;
  
  // Check if we already have it
  const profiles = allUsersProfiles$.get() || {};
  if (profiles[userId]) return;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    if (data) {
      (allUsersProfiles$ as any)[userId].set(data);
    }
  } catch (e) {
    console.warn(`[Realtime] Failed to fetch profile for ${userId}:`, e);
  }
};

/**
 * Manually set up a Realtime listener for the friends table.
 * Managed as a singleton to ensure only one active subscription exists globally.
 */
let friendsSubscription: any = null;

export const subscribeToFriendsRealtime = (userId: string) => {
  if (!userId) return;
  
  if (friendsSubscription) {
    console.log('[Realtime] Friends subscription already active');
    return;
  }

  console.log('[Realtime] Initializing robust global friends subscription for:', userId);
  
  friendsSubscription = supabase
    .channel(`friends-robust-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friends',
      },
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;
        
        if (eventType === 'INSERT' || eventType === 'UPDATE') {
          if (newRecord.user_id === userId || newRecord.friend_id === userId) {
            // Update local state
            (friends$ as any)[newRecord.id].set(newRecord);
            
            // Lazy load profile if it's a new or updated friendship
            const otherUserId = newRecord.user_id === userId ? newRecord.friend_id : newRecord.user_id;
            ensureProfileLoaded(otherUserId);
          }
        } else if (eventType === 'DELETE') {
          if (oldRecord && oldRecord.id) {
            (friends$ as any)[oldRecord.id].delete();
          }
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Robust global friends subscription active');
      }
    });
};

export const unsubscribeFriendsRealtime = () => {
  if (friendsSubscription) {
    console.log('[Realtime] Removing robust global friends subscription');
    supabase.removeChannel(friendsSubscription);
    friendsSubscription = null;
  }
};
