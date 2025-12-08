
import { creatures$ } from '@/stores/syncedObservables';
import { supabase } from '../services/supabase';

/**
 * Manually fetches all creatures from the database with pagination
 * to ensure the local catalog is complete for leaderboard calculations.
 */
export const fetchAllCreatures = async () => {
  console.log('[CreatureSync] Starting full manual fetch (paginated)...');
  const allCreatures: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  try {
    while (hasMore) {
      const { data, error, count } = await supabase
        .from('creatures')
        .select('*', { count: 'exact' })
        .order('id')
        .range(from, from + step - 1);

      if (error) {
        console.error('[CreatureSync] Error fetching page:', error);
        break;
      }

      if (!data || data.length === 0) {
        console.log('[CreatureSync] No more data.');
        hasMore = false;
        break;
      }

      console.log(`[CreatureSync] Fetched rows ${from} to ${from + data.length - 1} (Chunk: ${data.length}, Server Total: ${count})`);
      allCreatures.push(...data);

      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }

    // Merge into store
    if (allCreatures.length > 0) {
      console.log(`[CreatureSync] Merging TOTAL ${allCreatures.length} creatures into store.`);
      const creatureMap: Record<string, any> = {};
      allCreatures.forEach((c: any) => {
        creatureMap[c.id] = c;
      });
      creatures$.assign(creatureMap);
    }

  } catch (e) {
    console.error('[CreatureSync] Unexpected error:', e);
  }
};
