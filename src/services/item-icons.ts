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
  'Vision Crystal':    46746,
  'Amalgamated Gemstone': 68063,
}

// Known GW2 item IDs for gathering materials
export const MATERIAL_ITEM_IDS: Record<string, number> = {
  'Cabbage':           12332,  // Head of Cabbage
  'Carrot':            12134,
  'Flax':              74090,  // Pile of Flax Seeds
  'Flax Seed':         74090,
  'Thyme':             12248,  // Thyme Leaf
  'Parsley':           12246,  // Parsley Leaf
  'Lotus':             12510,  // Lotus Root
  'Lotus Root':        12510,
  'Potatoes':          12135,  // Potato
  'Potato':            12135,
  'Soybeans':          97105,  // Pile of Soybeans
  'Soybean':           97105,
  'Sugar Pumpkins':    12538,  // Sugar Pumpkin
  'Sugar Pumpkin':     12538,
  'Pumpkins':          12538,
  'Pumpkin':           12538,
  'Zucchini':          12330,
  'Lettuce':           12238,  // Head of Lettuce
  'Cactus':            67911,  // Fragrant Cactus Fruit
  'Mussels':           74266,  // Mussel
  'Mussel':            74266,
  'Elder Wood':        19722,  // Elder Wood Log
  'Artichoke':         12512,
  'Cauliflower':       12532,  // Head of Cauliflower
  'Strawberries':      12253,  // Strawberry
  'Strawberry':        12253,
  'Spinach':           12241,  // Spinach Leaf
  'Grapes':            12341,  // Grape
  'Grape':             12341,
  'Butternut Squash':  12511,
  'Lentils':           12534,  // Clove — closest available (no raw lentil item found)
  'Lentil':            12534,
}

// Known GW2 item IDs for vendor cost components
export const COST_ITEM_IDS_MAP: Record<string, number> = {
  'Memory of Battle':   71581,
  'Memories of Battle': 71581,
  'Bauble Bubble':      41886,
  'Bauble Bubbles':     41886,
}

// Currency IDs for the marquee
export const MARQUEE_CURRENCY_IDS = [1, 3, 7, 15, 23, 24, 26, 28, 32, 45, 63]
export const MARQUEE_ITEM_IDS     = [19976, 19675, 19721, 19925]

export const CURRENCY_LABELS: Record<number, string> = {
  1:  'Gold',
  3:  'Laurels',
  7:  'Fractal Relics',
  15: 'Badges of Honor',
  23: 'Spirit Shards',
  24: 'Pristine Relics',
  26: 'WvW Tickets',
  28: 'Magnetite Shards',
  32: 'Unbound Magic',
  45: 'Volatile Magic',
  63: 'Astral Acclaim',
}

export const ITEM_LABELS: Record<number, string> = {
  19976: 'Mystic Coins',
  19675: 'Mystic Clovers',
  19721: 'Globs of Ecto',
  19925: 'Obsidian Shards',
}
