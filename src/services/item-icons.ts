const BASE = 'https://api.guildwars2.com'

const itemIconCache    = new Map<number, string>()
const currencyIconCache = new Map<number, string>()

export async function fetchItemIconsBatch(ids: number[]): Promise<Map<number, string>> {
  const missing = ids.filter(id => !itemIconCache.has(id))
  if (missing.length) {
    try {
      const res = await fetch(`${BASE}/v2/items?ids=${missing.join(',')}`)
      if (res.ok) {
        const items: { id: number; icon?: string }[] = await res.json()
        for (const item of items) {
          if (item.icon) itemIconCache.set(item.id, item.icon)
        }
      }
    } catch { /* network error — silently skip */ }
  }
  return new Map(ids.flatMap(id => {
    const icon = itemIconCache.get(id)
    return icon ? [[id, icon]] : []
  }))
}

export async function fetchCurrencyIconsBatch(ids: number[]): Promise<Map<number, string>> {
  const missing = ids.filter(id => !currencyIconCache.has(id))
  if (missing.length) {
    try {
      const res = await fetch(`${BASE}/v2/currencies?ids=${missing.join(',')}`)
      if (res.ok) {
        const currencies: { id: number; icon?: string }[] = await res.json()
        for (const c of currencies) {
          if (c.icon) currencyIconCache.set(c.id, c.icon)
        }
      }
    } catch { /* silently skip */ }
  }
  return new Map(ids.flatMap(id => {
    const icon = currencyIconCache.get(id)
    return icon ? [[id, icon]] : []
  }))
}

// Known GW2 item IDs for vendor products
export const VENDOR_PRODUCT_ITEM_IDS: Record<string, number> = {
  'Mystic Clovers':    19675,
  'Mystic Clover':     19675,
  'Mystic Coins':      19976,
  'Mystic Coin':       19976,
  'Obsidian Shard':    19925,
  'Tome of Knowledge': 43741,
  'Vision Crystal':    68646,
}

// Known GW2 item IDs for gathering materials (best-effort; missing ones show no icon)
export const MATERIAL_ITEM_IDS: Record<string, number> = {
  'Cabbage':         12145,
  'Carrot':          12134,
  'Flax':            46839,
  'Thyme':           12155,
  'Parsley':         12156,
  'Lotus':           24281,
  'Lotus Root':      24281,
  'Potatoes':        12140,
  'Potato':          12140,
  'Soybeans':        12532,
  'Soybean':         12532,
  'Sugar Pumpkins':  12146,
  'Sugar Pumpkin':   12146,
  'Zucchini':        12141,
  'Lettuce':         12152,
  'Cactus':          12533,
  'Mussels':         24279,
  'Elder Wood':      19699,
  'Artichoke':       12143,
  'Cauliflower':     12142,
  'Strawberries':    12147,
  'Strawberry':      12147,
  'Spinach':         12131,
  'Grapes':          12148,
  'Grape':           12148,
  'Butternut Squash':12149,
  'Lentils':         12534,
  'Lentil':          12534,
  'Pumpkins':        12146,
  'Pumpkin':         12146,
}

// Currency IDs for the marquee
export const MARQUEE_CURRENCY_IDS = [1, 3, 4, 7, 15, 18, 23, 24, 28, 45, 54]
export const MARQUEE_ITEM_IDS     = [19976, 19675, 19721, 19925]

export const CURRENCY_LABELS: Record<number, string> = {
  1:  'Gold',
  3:  'Laurels',
  4:  'Badges of Honor',
  7:  'Fractal Relics',
  15: 'WvW Tickets',
  18: 'Unbound Magic',
  23: 'Spirit Shards',
  24: 'Pristine Relics',
  28: 'Magnetite Shards',
  45: 'Volatile Magic',
  54: 'Astral Acclaim',
}

export const ITEM_LABELS: Record<number, string> = {
  19976: 'Mystic Coins',
  19675: 'Mystic Clovers',
  19721: 'Globs of Ecto',
  19925: 'Obsidian Shards',
}
