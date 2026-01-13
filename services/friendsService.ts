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

export const sendFriendRequest = async (currentUserId: string, targetUserId: string) => {
  try {
    const payload: FriendInsert = {
        user_id: currentUserId,
        friend_id: targetUserId,
        status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('friends')
      .insert(payload as any)
      .select()
      .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            return { error: 'Friend request already exists' };
        }
        throw error;
    }
    return { data };
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
    const { data, error } = await supabase
      .from('friends')
      // @ts-ignore
      .update(payload as any)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('Error responding to friend request:', error);
    return { error };
  }
};

export const removeFriend = async (userId: string, friendId: string) => {
    try {
        // We need to find the relationship ID first, or delete using the unique constraint pair
        // Supabase doesn't support deleting with complex OR conditions easily in one go without RLS policies getting in the way sometimes,
        // but let's try finding the row first.
        
        // Actually, we can just try deleting both directions since we know the pair
        const { error } = await supabase
            .from('friends')
            .delete()
            .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);
            
        if (error) throw error;
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
