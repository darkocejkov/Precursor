// Shapes returned by https://edge.gw2efficiency.com/recipes

export interface GW2ERecipe {
  id: number
  type: 'Recipe'
  quantity: number
  /** Items produced per craft run. Can be fractional (e.g. 0.31 = 31% Mystic Forge chance). */
  output: number
  components: GW2EComponent[]
  prerequisites: { type: 'Recipe'; id: number }[]
  min_rating: number | null
  /** e.g. ['Armorsmith'], ['Mystic Forge'], ['Merchant'] */
  disciplines: string[]
  upgrade_id: number | null
  output_range: null
  achievement_id: number | null
  merchant: { name: string; locations: string[] } | null
  multipleRecipeCount: number | null
  daily_purchase_cap: number
  weekly_purchase_cap: number
}

export interface GW2EItem {
  id: number
  type: 'Item'
  quantity: number
  achievement_id: number | null
  achievement_bit: number | null
}

export interface GW2ECurrency {
  id: number
  type: 'Currency'
  quantity: number
  achievement_id: null
  achievement_bit: null
}

export type GW2EComponent = GW2ERecipe | GW2EItem | GW2ECurrency

// GW2 official API /v2/items shape (abbreviated)
export interface GW2Item {
  id: number
  name: string
  type: string
  rarity: string
  level: number
  details?: {
    type?: string  // armor slot: 'Helm', 'Shoulders', 'Coat', 'Gloves', 'Leggings', 'Boots'
    weight_class?: string  // 'Heavy', 'Medium', 'Light'
  }
}

export interface GW2Currency {
  id: number
  name: string
  description: string
}
