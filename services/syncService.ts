import * as Network from 'expo-network';
import { supabase, uploadImage } from './supabase';
import {
  saveCatalogCache,
  loadCatalogCache,
  saveUserDataCache,
  loadUserDataCache,
  saveDiveSitesCache,
  loadDiveSitesCache,
  queueOperation,
  getQueuedOperations,
  removeQueuedOperation,
  setStorageItem,
  getStorageItem
} from './cache';
import { Database, CachedCatalog, CachedUserData, PendingOperation, Creature, Category, DiveSite, Sighting, Wishlist, Profile } from '@/types/database';
import { SupabaseClient } from '@supabase/supabase-js';
import { debugLogger } from '@/utils/debugLogger';
import { handleSchemaCacheError } from '@/utils/supabaseUtils';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export class SyncService {
  private static instance: SyncService;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      const networkState = await Network.getNetworkStateAsync();
      this.isOnline = networkState.isConnected === true;
      await setStorageItem('isOffline', (!this.isOnline).toString());
      return this.isOnline;
    } catch (error) {
      console.error('Error checking connectivity:', error);
      this.isOnline = false;
      await setStorageItem('isOffline', 'true');
      return false;
    }
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  async pullCatalog(): Promise<CachedCatalog | null> {
    console.log('SyncService: Starting pullCatalog');
    if (!this.isOnline) {
      console.log('SyncService: Offline, loading cached catalog');
      return await loadCatalogCache();
    }

    try {
      console.log('SyncService: Fetching categories and creatures');
      
      // Use schema cache error handling
      const result = await handleSchemaCacheError(async () => {
        const [categoriesResult, creaturesResult] = await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('creatures').select('*').order('name')
        ]);

        // Check for errors
        if (categoriesResult.error) throw categoriesResult.error;
        if (creaturesResult.error) throw creaturesResult.error;

        return {
          categories: categoriesResult.data || [],
          creatures: creaturesResult.data || []
        };
      });

      if (!result) {
        // If all retries failed, return cached data
        console.log('SyncService: All catalog fetch attempts failed, returning cached data');
        return await loadCatalogCache();
      }

      const catalog: CachedCatalog = {
        categories: result.categories,
        creatures: result.creatures,
        lastSyncAt: new Date().toISOString()
      };

      await saveCatalogCache(catalog);
      console.log('SyncService: Catalog saved to cache');
      return catalog;
    } catch (error) {
      console.error('Error pulling catalog:', error);
      // Try to return cached data as fallback
      return await loadCatalogCache();
    }
  }

  async pullDiveSites(): Promise<DiveSite[]> {
    console.log('SyncService: Starting pullDiveSites');
    if (!this.isOnline) {
      console.log('SyncService: Offline, loading cached dive sites');
      return (await loadDiveSitesCache()) || [];
    }

    try {
      console.log('SyncService: Fetching dive sites');
      
      // Use schema cache error handling
      const result = await handleSchemaCacheError(async () => {
        const { data, error } = await supabase
          .from('dive_sites')
          .select('*')
          .order('name');

        if (error) throw error;
        return data || [];
      });

      if (!result) {
        // If all retries failed, return cached data
        console.log('SyncService: All dive sites fetch attempts failed, returning cached data');
        return (await loadDiveSitesCache()) || [];
      }

      await saveDiveSitesCache(result);
      console.log('SyncService: Dive sites saved to cache');
      return result;
    } catch (error) {
      console.error('Error pulling dive sites:', error);
      // Try to return cached data as fallback
      return (await loadDiveSitesCache()) || [];
    }
  }

  async pullUserData(): Promise<CachedUserData | null> {
    console.log('SyncService: Starting pullUserData');
    if (!this.isOnline) {
      console.log('SyncService: Offline, loading cached user data');
      return await loadUserDataCache();
    }

    try {
      // First check if there's an authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('SyncService: getUser response:', { user: !!user, userError: !!userError });
      
      // Handle specific auth errors
      if (userError) {
        if (userError.message.includes('User from sub claim in JWT does not exist')) {
          console.error('Auth token is invalid - user may have been deleted. Clearing auth state.');
          // This is a critical error - the user token is invalid
          // We should notify the user and redirect to login
          // For now, we'll just return cached data
          return await loadUserDataCache();
        }
        console.log('Auth error when pulling user data:', userError.message);
        return await loadUserDataCache();
      }
      
      if (!user) {
        console.log('No authenticated user found when pulling user data');
        return await loadUserDataCache();
      }

      // Fetch profile with proper error handling
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      console.log('SyncService: Profile fetch result:', { profileData: !!profileData, profileError: !!profileError });
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }
      
      // Fetch other user data
      console.log('SyncService: Fetching sightings, wishlists, and achievements');
      const [sightingsResult, wishlistsResult, achievementsResult] = await Promise.all([
        supabase.from('sightings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('wishlists').select('*').eq('user_id', user.id),
        supabase.from('achievements').select('*')
      ]);
      
      console.log('SyncService: Data fetch results:', { 
        sightingsCount: sightingsResult.data?.length, 
        wishlistsCount: wishlistsResult.data?.length, 
        achievementsCount: achievementsResult.data?.length,
        sightingsError: sightingsResult.error,
        wishlistsError: wishlistsResult.error,
        achievementsError: achievementsResult.error
      });

      // Handle case where profile doesn't exist yet
      let profile = profileData;
      if (!profile && !profileError) {
        console.log('Profile not found for user, checking if it was created by trigger');
        console.log('User ID:', user?.id);
        
        // Wait a bit for the database trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Try to fetch the profile again
        const { data: retryProfileData, error: retryProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        
        console.log('SyncService: Profile retry fetch result:', { retryProfileData: !!retryProfileData, retryProfileError: !!retryProfileError });
        
        if (retryProfileError) {
          console.error('Error retrying profile fetch:', retryProfileError);
        }
        
        profile = retryProfileData;
        
        // If profile still doesn't exist, the database trigger may have failed
        // In this case, we should not try to manually create it as it would violate RLS
        // Instead, we should log the issue and continue with null profile
        if (!profile && !retryProfileError) {
          console.log('Profile still not found after waiting for trigger. This may indicate an issue with the database trigger.');
          console.log('Not attempting manual creation due to RLS policy restrictions.');
        } else if (profile) {
          console.log('Profile found after retry');
        } else if (retryProfileError) {
          console.log('Profile check completed with error:', retryProfileError?.message);
        }
      } else if (profile) {
        console.log('Profile found for user');
      } else if (profileError) {
        console.log('Profile check completed with error:', profileError?.message);
      }

      const sightings = sightingsResult.data || [];
      const wishlists = wishlistsResult.data || [];
      const achievements = achievementsResult.data || [];

      // Calculate stats
      const uniqueCreatures = new Set(sightings.map((s: Sighting) => s.creature_id)).size;
      
      // Get catalog for points calculation
      const catalog = await loadCatalogCache();
      const totalPoints = sightings.reduce((total: number, sighting: Sighting) => {
        // Award points only for first sighting of each creature
        const sameSightings = sightings.filter((s: Sighting) => s.creature_id === sighting.creature_id);
        const sortedSightings = sameSightings.sort((a: Sighting, b: Sighting) => a.created_at.localeCompare(b.created_at));
        const firstSighting = sortedSightings.length > 0 ? sortedSightings[0] : null;
        const isFirstSighting = (firstSighting as Sighting | null)?.id === sighting.id;
      
        if (isFirstSighting && catalog) {
          const creature = catalog.creatures.find((c: Creature) => c.id === sighting.creature_id);
          return total + (creature?.points || 50);
        }
        return total;
      }, 0);

      const totalCreatures = catalog?.creatures.length || 0;
      const overallCompletion = totalCreatures > 0 ? (uniqueCreatures / totalCreatures) * 100 : 0;

      // Calculate category stats
      const categoryStats: Record<string, { seen: number; total: number; completion: number }> = {};
      const categoryNames: Record<string, string> = {};
      if (catalog) {
        const categoryGroups = catalog.categories.reduce((acc, category) => {
          categoryNames[category.id] = category.name;
          acc[category.id] = {
            name: category.name,
            total: catalog.creatures.filter(c => c.category_id === category.id).length,
            seenCreatures: new Set<string>()
          };
          return acc;
        }, {} as Record<string, { name: string; total: number; seenCreatures: Set<string> }>);

        // Count unique seen creatures per category
        sightings.forEach((sighting: Sighting) => {
          const creature = catalog.creatures.find((c: Creature) => c.id === sighting.creature_id);
          if (creature && categoryGroups[creature.category_id]) {
            categoryGroups[creature.category_id].seenCreatures.add(creature.id);
          }
        });

        Object.entries(categoryGroups).forEach(([categoryId, stats]) => {
          categoryStats[categoryId] = {
            seen: stats.seenCreatures.size,
            total: stats.total,
            completion: stats.total > 0 ? (stats.seenCreatures.size / stats.total) * 100 : 0
          };
        });
      }

      const userData: CachedUserData = {
        profile: profile || null,
        sightings,
        wishlists,
        achievements,
        stats: {
          totalPoints,
          uniqueCreatures,
          overallCompletion,
          categoryStats,
          categoryNames
        },
        lastSyncAt: new Date().toISOString()
      };

      await saveUserDataCache(userData);
      console.log('SyncService: User data saved to cache');
      return userData;
    } catch (error) {
      console.error('Error pulling user data:', error);
      return await loadUserDataCache();
    }
  }


  async pushQueue(): Promise<void> {
    console.log('SyncService: Starting pushQueue');
    if (!this.isOnline || this.syncInProgress) {
      console.log('SyncService: Skipping pushQueue - online:', this.isOnline, 'inProgress:', this.syncInProgress);
      return;
    }

    this.syncInProgress = true;
    const operations = await getQueuedOperations();
    console.log('SyncService: Retrieved queued operations:', operations.length);

    for (const operation of operations) {
      try {
        console.log('SyncService: Executing operation:', operation);
        await this.executeOperation(operation);
        await removeQueuedOperation(operation.clientId);
        console.log('SyncService: Operation executed and removed from queue');
      } catch (error) {
        console.error('Error executing operation:', operation, error);
        // Continue with next operation rather than stopping the sync
      }
    }

    this.syncInProgress = false;
    console.log('SyncService: PushQueue completed');
  }

  private async executeOperation(operation: PendingOperation): Promise<void> {
    const { table, op, payload } = operation;

    // Handle image uploads first if present
    if (payload.image_url && payload.image_url.startsWith('file://')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const imagePath = `sightings/${user.id}/${Date.now()}.jpg`;
        const publicUrl = await uploadImage(payload.image_url, 'sightings', imagePath);
        if (publicUrl) {
          payload.image_url = publicUrl;
        } else {
          delete payload.image_url; // Remove if upload failed
        }
      }
    }

    switch (table) {
      case 'sightings':
        await this.executeSightingOperation(op, payload);
        break;
      case 'wishlists':
        await this.executeWishlistOperation(op, payload);
        break;
      case 'profiles':
        await this.executeProfileOperation(op, payload);
        break;
    }
  }

  private async executeSightingOperation(op: string, payload: Partial<Sighting>): Promise<void> {
    console.log('SyncService: Executing sighting operation:', { op, payload });
    switch (op) {
      case 'insert':
        // Ensure no id field is included in the payload
        const { id, ...insertPayload } = payload;
        console.log('SyncService: Inserting sighting with payload:', insertPayload);
        const { data, error: insertError } = (supabase as any)
          .from('sightings')
          .insert([insertPayload])
          .select()
          .single();
        console.log('SyncService: Sighting insert result:', { data, insertError });
        if (insertError) throw insertError;
        console.log('Sighting inserted with server-generated ID:', data?.id);
        break;
      case 'update':
        console.log('SyncService: Updating sighting with payload:', payload);
        const { error: updateError } = (supabase as any)
          .from('sightings')
          .update(payload)
          .eq('id', payload.id!);
        console.log('SyncService: Sighting update result:', { updateError });
        if (updateError) throw updateError;
        break;
      case 'delete':
        console.log('SyncService: Deleting sighting with ID:', payload.id);
        const { error: deleteError } = (supabase as any)
          .from('sightings')
          .delete()
          .eq('id', payload.id!);
        console.log('SyncService: Sighting delete result:', { deleteError });
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async executeWishlistOperation(op: string, payload: Partial<Wishlist>): Promise<void> {
    switch (op) {
      case 'insert':
        const { error: insertError } = (supabase as any)
          .from('wishlists')
          .upsert(payload, { onConflict: 'id' });
        if (insertError) throw insertError;
        break;
      case 'delete':
        const { error: deleteError } = (supabase as any)
          .from('wishlists')
          .delete()
          .eq('id', payload.id!);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async executeProfileOperation(op: string, payload: Partial<Profile>): Promise<void> {
    switch (op) {
      case 'update':
        const { error } = (supabase as any)
          .from('profiles')
          .update(payload)
          .eq('id', payload.id!);
        if (error) throw error;
        break;
    }
  }

  async fullSync(): Promise<void> {
    console.log('SyncService: Starting fullSync');
    await this.checkConnectivity();
    console.log('SyncService: Connectivity check complete, online:', this.isOnline);
    if (this.isOnline) {
      await this.pushQueue();
      console.log('SyncService: PushQueue completed, starting data pulls');
      await Promise.all([
        this.pullCatalog(),
        this.pullDiveSites(),
        this.pullUserData()
      ]);
      console.log('SyncService: All data pulls completed');
    }
    console.log('SyncService: FullSync completed');
  }

  async queueSighting(sighting: any): Promise<void> {
    console.log('SyncService: Queueing sighting:', sighting);
    const operation: PendingOperation = {
      clientId: `sighting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table: 'sightings',
      op: 'insert',
      payload: {
        user_id: sighting.user_id,
        creature_id: sighting.creature_id,
        date: sighting.date,
        dive_notes: sighting.dive_notes || null,
        image_url: sighting.image_url || null,
        dive_site_id: sighting.dive_site_id || null,
        dive_type: sighting.dive_type || null,
        time_of_day: sighting.time_of_day || null,
        depth: sighting.depth ? parseFloat(sighting.depth) : null,
        creature_notes: sighting.creature_notes || null
      },
      ts: Date.now()
    };
    console.log('SyncService: Queuing operation:', operation);
    await queueOperation(operation);
    console.log('SyncService: Operation queued successfully');
  }

  async queueWishlistToggle(wishlistItem: any, isAdd: boolean): Promise<void> {
    const operation: PendingOperation = {
      clientId: `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      table: 'wishlists',
      op: isAdd ? 'insert' : 'delete',
      payload: wishlistItem,
      ts: Date.now()
    };
    await queueOperation(operation);
  }

  /**
   * Fetch user profile with proper error handling
   */
  async fetchUserProfile(userId: string): Promise<{ profile: any; error: any }> {
    try {
      console.log('SyncService: Attempting to fetch user profile for ID:', userId);
      
      // First try to get the profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to handle null results safely
      
      if (error) {
        console.error('SyncService: Error fetching profile:', error);
        return { profile: null, error };
      }
      
      console.log('SyncService: Profile fetch result:', { profile });
      return { profile, error: null };
    } catch (error: any) {
      console.error('SyncService: Exception in fetchUserProfile:', error);
      return { profile: null, error };
    }
  }

  /**
   * Ensure user profile exists, creating it if necessary
   */
  async ensureUserProfile(userId: string, userEmail: string): Promise<boolean> {
    try {
      console.log('SyncService: Ensuring profile exists for user:', userId);
      
      // Check if profile already exists
      const { profile, error: fetchError } = await this.fetchUserProfile(userId);
      
      if (fetchError) {
        console.error('SyncService: Error checking profile existence:', fetchError);
        return false;
      }
      
      // If profile exists, we're done
      if (profile) {
        console.log('SyncService: Profile already exists for user:', userId);
        return true;
      }
      
      // Profile doesn't exist, try to create it
      console.log('SyncService: Profile does not exist, attempting to create');
      
      // Try to create profile (this should work if RLS policies allow it)
      const { data, error: insertError } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: userEmail,
            full_name: null,
            avatar_url: null,
            membership_tier: null,
            is_premium: false,
            has_seen_onboarding: false
          }
        ])
        .select()
        .maybeSingle();
      
      if (insertError) {
        console.error('SyncService: Error creating profile:', insertError);
        // If we can't create it manually, it's likely an RLS issue
        // The database trigger should have created it, so let's wait and check again
        return false;
      }
      
      console.log('SyncService: Profile created successfully:', data);
      return true;
      
    } catch (error: any) {
      console.error('SyncService: Exception in ensureUserProfile:', error);
      return false;
    }
  }

  // Add a public method to manually create a profile
  async createProfileForCurrentUser(): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Handle case where there's no authenticated user
      if (userError) {
        console.error('Error getting user:', userError);
        return false;
      }
      
      if (!user) {
        console.log('No user found');
        return false;
      }

      console.log('Checking if profile exists for user:', user.id);
      
      // First check if profile already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
        
      if (fetchError) {
        console.error('Error checking for existing profile:', fetchError);
        return false;
      }
      
      if (existingProfile) {
        console.log('Profile already exists for user');
        return true;
      }
      
      console.log('Profile does not exist, this may indicate an issue with the database trigger');
      console.log('Not attempting manual creation due to RLS policy restrictions');
      return false;
    } catch (error: any) {
      console.error('Error checking profile:', error);
      return false;
    }
  }
}

export const syncService = SyncService.getInstance();