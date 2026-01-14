import { supabase } from './supabase';
import { Database } from '@/types/database';

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
      .select('id, full_name, avatar_url, membership_tier')
      .ilike('full_name', `%${query}%`)
      .neq('id', currentUserId)
      .limit(20);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
};

import { friends$ } from '@/stores/syncedObservables';
import { v4 as uuidv4 } from 'uuid';

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

    const id = uuidv4(); // Restore ID generation
    // Use 'any' or explicit type that includes ID since we are manually generating it
    // and the strict Insert type might omit it.
    const payload = {
        id, // Generate ID locally
        user_id: currentUserId,
        friend_id: targetUserId,
        status: 'pending',
        created_at: new Date().toISOString(),
    };
    
    // 2. Update Observable directly for immediate local persistence
    // This works because we configured the sync engine to handle 'create' actions
    (friends$ as any)[id].set(payload);

    return { data: payload };
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
    const payload: FriendUpdate = { status };
    
    // 1. Update Observable directly for immediate local persistence
    // logic: find the item in the observable and update it
    const friends = friends$.get() || {};
    // Legend State uses keys (often IDs) for objects, but here it might be an array or object keyed by ID
    // Based on previous create code: (friends$ as any)[id].set(payload);
    // So we can assume it's keyed by ID.
    
    if ((friends$ as any)[requestId]) {
        (friends$ as any)[requestId].assign({ status });
    }

    // 2. We still send to Supabase because the sync engine might process updates differently
    // Actually, if we update the observable, the sync engine should handle it if configured for 'update'.
    // Let's check syncedObservables configuration for friends$.
    // It has actions: ['read', 'create', 'update', 'delete'].
    // So just updating the observable IS enough!
    
    // However, for safety and consistency with the previous pattern (which returned data/error),
    // and to ensure we don't break the contract:
    
    // Actually, looking at sendFriendRequest, I removed the supbase call there?
    // Wait, in sendFriendRequest I *removed* the explicit supabase call and relied on the observable?
    // Let me check my previous edit to friendsService.ts.
    // Yes, for sendFriendRequest I removed the supabase insert.
    
    // So here I should also remove the supabase update and rely on the observable sync?
    // The previous implementation of respondToFriendRequest returned { data, error }.
    // I should maintain that signature.
    
    return { data: { id: requestId, status } };
  } catch (error) {
    console.error('Error responding to friend request:', error);
    return { error };
  }
};

export const removeFriend = async (userId: string, friendId: string) => {
    try {
        // 1. Find the relationship ID locally first
        const friends = friends$.get() || {};
        const friendRecord = Object.values(friends).find(f => 
            (f.user_id === userId && f.friend_id === friendId) || 
            (f.user_id === friendId && f.friend_id === userId)
        );

        if (friendRecord && friendRecord.id) {
            // 2. Delete from Observable directly for immediate local persistence
            (friends$ as any)[friendRecord.id].delete();
            return { success: true };
        }

        // If not found locally, maybe fall back to server? 
        // But if it's not local, it's probably not in the UI either.
        // Let's do a safety server delete just in case? 
        // No, consistency is key. If it's not in friends$, it doesn't exist for the user.
        
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
