
import { diveSites$ } from '@/stores/syncedObservables';
import { supabase } from '../services/supabase';

/**
 * Manually fetches all dive sites from the database with pagination
 * to ensure the local catalog is complete for searching.
 */
export const fetchAllDiveSites = async () => {
  console.log('[DiveSiteSync] Starting full manual fetch (paginated)...');
  const allDiveSites: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  try {
    while (hasMore) {
      const { data, error, count } = await supabase
        .from('dive_sites')
        .select('*', { count: 'exact' })
        .order('id')
        .range(from, from + step - 1);

      if (error) {
        console.error('[DiveSiteSync] Error fetching page:', error);
        break;
      }

      if (!data || data.length === 0) {
        console.log('[DiveSiteSync] No more data.');
        hasMore = false;
        break;
      }

      console.log(`[DiveSiteSync] Fetched rows ${from} to ${from + data.length - 1} (Chunk: ${data.length}, Server Total: ${count})`);
      allDiveSites.push(...data);

      if (data.length < step) {
        hasMore = false;
      } else {
        from += step;
      }
    }

    // Merge into store
    if (allDiveSites.length > 0) {
      console.log(`[DiveSiteSync] Merging TOTAL ${allDiveSites.length} dive sites into store.`);
      const diveSiteMap: Record<string, any> = {};
      allDiveSites.forEach((d: any) => {
        diveSiteMap[d.id] = d;
      });
      diveSites$.assign(diveSiteMap);
    }

  } catch (e) {
    console.error('[DiveSiteSync] Unexpected error:', e);
  }
};
