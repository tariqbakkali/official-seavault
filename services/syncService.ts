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
import { CachedCatalog, CachedUserData, PendingOperation, Creature, Category, DiveSite, Sighting, Wishlist, Profile } from '@/types/database';

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
    if (!this.isOnline) {
      return await loadCatalogCache();
    }

    try {
      const [categoriesResult, creaturesResult] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('creatures').select('*').order('name')
      ]);

      if (categoriesResult.error) throw categoriesResult.error;
      if (creaturesResult.error) throw creaturesResult.error;

      const catalog: CachedCatalog = {
        categories: categoriesResult.data || [],
        creatures: creaturesResult.data || [],
        lastSyncAt: new Date().toISOString()
      };

      await saveCatalogCache(catalog);
      return catalog;
    } catch (error) {
      console.error('Error pulling catalog:', error);
      return await loadCatalogCache();
    }
  }

  async pullDiveSites(): Promise<DiveSite[]> {
    if (!this.isOnline) {
      return (await loadDiveSitesCache()) || [];
    }

    try {
      const { data, error } = await supabase
        .from('dive_sites')
        .select('*')
        .order('name');

      if (error) throw error;

      const diveSites = data || [];
      await saveDiveSitesCache(diveSites);
      return diveSites;
    } catch (error) {
      console.error('Error pulling dive sites:', error);
      return (await loadDiveSitesCache()) || [];
    }
  }

  async pullUserData(): Promise<CachedUserData | null> {
    if (!this.isOnline) {
      return await loadUserDataCache();
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const [profileResult, sightingsResult, wishlistsResult, achievementsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('sightings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('wishlists').select('*').eq('user_id', user.id),
        supabase.from('achievements').select('*')
      ]);

      // Handle case where profile doesn't exist yet
      let profile = profileResult.data;
      if (!profile) {
        // Try to create profile if it doesn't exist
        console.log('Profile not found for user, attempting to create one');
        console.log('User ID:', user?.id);
        
        // Try multiple approaches to create the profile
        let profileCreated = false;
        let lastError: any = null;
        
        // Approach 1: Try with full data
        try {
          const fullProfilePayload: any = {
            id: user.id,
            email: user.email || null,
            full_name: null,
            avatar_url: null,
            membership_tier: null,
            is_premium: null,
            has_seen_onboarding: false,
          };
          
          console.log('Attempting full profile creation in syncService:', fullProfilePayload);
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([fullProfilePayload])
            .select()
            .single();

          console.log('Full profile creation result in syncService:', { newProfile, insertError });

          if (insertError) {
            throw insertError;
          } else {
            profile = newProfile;
            profileCreated = true;
            console.log('Full profile created successfully in syncService');
          }
        } catch (error: any) {
          console.error('Full profile creation failed in syncService:', error);
          lastError = error;
        }
        
        // Approach 2: Try with minimal data if full approach failed
        if (!profileCreated) {
          try {
            const minimalProfilePayload: any = {
              id: user.id,
              email: user.email || null,
            };
            
            console.log('Attempting minimal profile creation in syncService:', minimalProfilePayload);
            
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([minimalProfilePayload])
              .select()
              .single();

            console.log('Minimal profile creation result in syncService:', { newProfile, insertError });

            if (insertError) {
              throw insertError;
            } else {
              profile = newProfile;
              profileCreated = true;
              console.log('Minimal profile created successfully in syncService');
              
              // Now try to update with full data
              try {
                const fullProfilePayload: any = {
                  full_name: null,
                  avatar_url: null,
                  membership_tier: null,
                  is_premium: null,
                  has_seen_onboarding: false,
                };
                
                const { data: updateData, error: updateError } = await supabase
                  .from('profiles')
                  .update(fullProfilePayload)
                  .eq('id', user.id)
                  .select()
                  .single();
                  
                console.log('Full profile update result in syncService:', { updateData, updateError });
                
                if (updateError) {
                  console.error('Failed to update profile with full data in syncService:', updateError);
                } else {
                  profile = updateData;
                  console.log('Profile updated with full data in syncService');
                }
              } catch (updateError: any) {
                console.error('Failed to update profile with full data in syncService:', updateError);
              }
            }
          } catch (error: any) {
            console.error('Minimal profile creation failed in syncService:', error);
            lastError = error;
          }
        }
        
        // Log error if all approaches failed
        if (!profileCreated && lastError) {
          console.error('All profile creation approaches failed in syncService:', lastError);
        }
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
        profile,
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
      return userData;
    } catch (error) {
      console.error('Error pulling user data:', error);
      return await loadUserDataCache();
    }
  }


  async pushQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    const operations = await getQueuedOperations();

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        await removeQueuedOperation(operation.clientId);
      } catch (error) {
        console.error('Error executing operation:', operation, error);
        // Continue with next operation rather than stopping the sync
      }
    }

    this.syncInProgress = false;
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
    switch (op) {
      case 'insert':
        // Ensure no id field is included in the payload
        const { id, ...insertPayload } = payload;
        const { data, error: insertError } = await supabase
          .from('sightings')
          .insert(insertPayload as any)
          .select()
          .single();
        if (insertError) throw insertError;
        console.log('Sighting inserted with server-generated ID:', (data as any)?.id);
        break;
      case 'update':
        const { error: updateError } = await (supabase as any)
          .from('sightings')
          .update(payload)
          .eq('id', payload.id!);
        if (updateError) throw updateError;
        break;
      case 'delete':
        const { error: deleteError } = await supabase
          .from('sightings')
          .delete()
          .eq('id', payload.id!);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async executeWishlistOperation(op: string, payload: Partial<Wishlist>): Promise<void> {
    switch (op) {
      case 'insert':
        const { error: insertError } = await supabase
          .from('wishlists')
          .upsert(payload as any, { onConflict: 'id' });
        if (insertError) throw insertError;
        break;
      case 'delete':
        const { error: deleteError } = await supabase
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
        const { error } = await (supabase as any)
          .from('profiles')
          .update(payload)
          .eq('id', payload.id!);
        if (error) throw error;
        break;
    }
  }

  async fullSync(): Promise<void> {
    await this.checkConnectivity();
    if (this.isOnline) {
      await this.pushQueue();
      await Promise.all([
        this.pullCatalog(),
        this.pullDiveSites(),
        this.pullUserData()
      ]);
    }
  }

  async queueSighting(sighting: any): Promise<void> {
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
    await queueOperation(operation);
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

  // Add a public method to manually create a profile
  async createProfileForCurrentUser(): Promise<boolean> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        return false;
      }
      
      if (!user) {
        console.log('No user found');
        return false;
      }

      console.log('Manually creating profile for user:', user.id);
      
      // Try to create profile with minimal data first
      const minimalProfilePayload: any = {
        id: user.id,
        email: user.email || null,
      };
      
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([minimalProfilePayload]);

      if (insertError) {
        console.error('Failed to create profile:', insertError);
        return false;
      } else {
        console.log('Profile created successfully');
        return true;
      }
    } catch (error: any) {
      console.error('Error creating profile:', error);
      return false;
    }
  }
}

export const syncService = SyncService.getInstance();