import { fetchWithCache } from './cache.ts'
import type { GW2ERecipe } from './types.ts'

// Pinned version for reproducibility. Update when refreshing data.
const VERSION = '2024-07-20T01:00:00.000Z'
const BASE    = 'https://edge.gw2efficiency.com'

export async function fetchRecipes(ids: number[]): Promise<GW2ERecipe[]> {
  if (!ids.length) return []
  const url  = `${BASE}/recipes?v=${encodeURIComponent(VERSION)}&ids=${ids.join(',')}`
  const data = await fetchWithCache<unknown>(url)
  if (!Array.isArray(data)) return []
  return data.filter((r): r is GW2ERecipe => r !== null && typeof r === 'object' && r.type === 'Recipe')
}

/**
 * From potentially multiple recipe entries for one item, pick the most
 * useful one for tracking purposes: prefer full crafting paths over
 * pure-vendor entries; tie-break by most top-level components.
 */
export function pickBestRecipe(recipes: GW2ERecipe[]): GW2ERecipe | null {
  if (!recipes.length) return null
  return recipes.reduce((best, cur) => {
    const bestIsVendorOnly = best.disciplines.every(d => d === 'Merchant')
    const curIsVendorOnly  = cur.disciplines.every(d => d === 'Merchant')
    if (bestIsVendorOnly && !curIsVendorOnly) return cur
    if (!bestIsVendorOnly && curIsVendorOnly) return best
    // both same: prefer more components (richer tree)
    return (cur.components?.length ?? 0) >= (best.components?.length ?? 0) ? cur : best
  })
}
