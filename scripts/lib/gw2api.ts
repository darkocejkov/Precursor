import { fetchWithCache } from './cache.ts'
import type { GW2Item, GW2Currency } from './types.ts'

const BASE = 'https://api.guildwars2.com'

export async function fetchItemDetails(id: number): Promise<GW2Item> {
  return fetchWithCache<GW2Item>(`${BASE}/v2/items/${id}`)
}

export async function fetchItemDetailsBulk(ids: number[]): Promise<Map<number, GW2Item>> {
  const map   = new Map<number, GW2Item>()
  const BATCH = 200
  for (let i = 0; i < ids.length; i += BATCH) {
    const chunk = ids.slice(i, i + BATCH)
    const items = await fetchWithCache<GW2Item[]>(
      `${BASE}/v2/items?ids=${chunk.join(',')}&lang=en`
    )
    for (const item of items) map.set(item.id, item)
  }
  return map
}

export async function fetchCurrencies(): Promise<Map<number, GW2Currency>> {
  const currencies = await fetchWithCache<GW2Currency[]>(
    `${BASE}/v2/currencies?ids=all`
  )
  return new Map(currencies.map(c => [c.id, c]))
}
