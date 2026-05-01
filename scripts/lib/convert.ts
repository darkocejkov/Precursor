import type { GW2EComponent, GW2ERecipe, GW2Item, GW2Currency } from './types.ts'

/** Matches MaterialNode in src/types.ts */
export interface MaterialNode {
  name: string
  quantity?: number
  itemId?: number
  source?: string
  note?: string
  children?: MaterialNode[]
}

export function collectItemIds(comp: GW2EComponent, out: Set<number> = new Set()): Set<number> {
  if (comp.type === 'Currency') return out
  out.add(comp.id)
  if (comp.type === 'Recipe') comp.components?.forEach(c => collectItemIds(c, out))
  return out
}

export function convertNode(
  comp: GW2EComponent,
  items: Map<number, GW2Item>,
  currencies: Map<number, GW2Currency>
): MaterialNode {
  // Currency nodes (gold, karma, Legendary Insights as currency, etc.)
  if (comp.type === 'Currency') {
    const cur = currencies.get(comp.id)
    return {
      name: cur?.name ?? `Currency #${comp.id}`,
      quantity: comp.quantity,
    }
  }

  const item = items.get(comp.id)
  const name = item?.name ?? `Item #${comp.id}`

  // Leaf item — raw material in bank/material storage
  if (comp.type === 'Item') {
    return { name, quantity: comp.quantity, itemId: comp.id }
  }

  // Recipe node — craftable intermediate or final item
  const node: MaterialNode = {
    name,
    quantity: comp.quantity,
    itemId: comp.id,
  }

  if (comp.merchant) {
    node.source = comp.merchant.name
    if (comp.merchant.locations?.length) {
      node.note = `Locations: ${comp.merchant.locations.join(', ')}`
    }
  }

  if (comp.output > 0 && comp.output < 1) {
    const runs = Math.ceil((comp.quantity ?? 1) / comp.output)
    node.note = [node.note, `~${runs} Mystic Forge attempts for ${comp.quantity} (${(comp.output * 100).toFixed(0)}% each)`]
      .filter(Boolean).join(' — ')
  } else if (comp.output > 1 && comp.output !== comp.quantity) {
    node.note = [node.note, `Produces ${comp.output}× per craft`].filter(Boolean).join(' — ')
  }

  if (comp.components?.length) {
    node.children = comp.components.map(c => convertNode(c, items, currencies))
  }

  return node
}

/**
 * Structural equality check for recipe trees (ignores name, keeps id+quantity+children shape).
 * Used to detect duplicate recipes across weight classes.
 */
export function recipeStructureKey(recipe: GW2ERecipe): string {
  function nodeKey(c: GW2EComponent): string {
    if (c.type === 'Currency') return `C${c.id}:${c.quantity}`
    if (c.type === 'Item')     return `I${c.id}:${c.quantity}`
    const sub = (c.components ?? []).map(nodeKey).sort().join('|')
    return `R${c.id}:${c.quantity}[${sub}]`
  }
  const sub = (recipe.components ?? []).map(nodeKey).sort().join('|')
  return `R${recipe.id}[${sub}]`
}
