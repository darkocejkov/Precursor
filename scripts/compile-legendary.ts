#!/usr/bin/env tsx
/**
 * LeggyTracker — Legendary Recipe Compiler
 *
 * Fetches full crafting trees for GW2 legendary armor and weapons from
 * gw2efficiency and the official GW2 API, then writes structured JSON
 * to scripts/output/ for review and integration into src/data/.
 *
 * Usage:
 *   npm run compile:legendary                   # Envoy armor + gen-1 weapons
 *   npm run compile:legendary -- --armor-only
 *   npm run compile:legendary -- --weapons-only
 *   npm run compile:legendary -- --obsidian-armor
 *   npm run compile:legendary -- --mistforged-armor
 *   npm run compile:legendary -- --ids 80384,30699
 *   npm run compile:legendary -- --from-csv     # discover all legendaries from CSV
 *   npm run compile:legendary -- --clear-cache  # bust cache and re-fetch everything
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fetchRecipes, pickBestRecipe }   from './lib/gw2efficiency.ts'
import { fetchItemDetails, fetchItemDetailsBulk, fetchCurrencies } from './lib/gw2api.ts'
import { loadCSV, findLegendaryItems }    from './lib/csv.ts'
import { collectItemIds, convertNode, recipeStructureKey } from './lib/convert.ts'
import { clearCache } from './lib/cache.ts'
import type { GW2ERecipe } from './lib/types.ts'
import type { MaterialNode } from './lib/convert.ts'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, 'output')
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

// ── Armor slot groupings ──────────────────────────────────────────────────────
// Each slot lists [Heavy, Medium, Light] item IDs.
// compileArmorSlot fetches all variants and deduplicates identical recipes.

const ENVOY_ARMOR: Record<string, { ids: number[]; slot: string }> = {
  helm:      { slot: 'Helm',      ids: [80384, 80296, 80248] },
  shoulders: { slot: 'Shoulders', ids: [80435, 80131, 80145] },
  chest:     { slot: 'Chest',     ids: [80254, 80578, 80190] },
  gloves:    { slot: 'Gloves',    ids: [80205, 80161, 80111] },
  leggings:  { slot: 'Leggings',  ids: [80277, 80252, 80356] },
  boots:     { slot: 'Boots',     ids: [80557, 80281, 80399] },
}

// Mistforged Triumphant Hero's Armor (WvW T2 legendary)
const MISTFORGED_ARMOR: Record<string, { ids: number[]; slot: string }> = {
  helm:      { slot: 'Helm',      ids: [84301, 82180, 82925] },
  shoulders: { slot: 'Shoulders', ids: [84181, 83087, 83308] },
  chest:     { slot: 'Chest',     ids: [84481, 82102, 84508] },
  gloves:    { slot: 'Gloves',    ids: [82348, 82109, 82552] },
  leggings:  { slot: 'Leggings',  ids: [83702, 82502, 83862] },
  boots:     { slot: 'Boots',     ids: [83094, 83699, 83482] },
}

// Obsidian Armor (SotO open-world legendary, 2023)
const OBSIDIAN_ARMOR: Record<string, { ids: number[]; slot: string }> = {
  helm:      { slot: 'Helm',      ids: [101544, 101614, 101516] },
  shoulders: { slot: 'Shoulders', ids: [101551, 101645, 101462] },
  chest:     { slot: 'Chest',     ids: [101521, 101556, 101499] },
  gloves:    { slot: 'Gloves',    ids: [101609, 101570, 101536] },
  leggings:  { slot: 'Leggings',  ids: [101568, 101579, 101501] },
  boots:     { slot: 'Boots',     ids: [101460, 101602, 101535] },
}

const GEN1_WEAPON_IDS = [
  30684, 30685, 30686, 30687, 30688, 30689, 30690,
  30691, 30692, 30693, 30694, 30695, 30696, 30697,
  30698, 30699, 30700, 30701, 30702, 30703, 30704,
]

// ── Output record shape ───────────────────────────────────────────────────────

interface CompiledItem {
  itemId: number
  name: string
  type: 'armor' | 'weapon'
  setKey: string           // 'envoy' | 'obsidian' | 'mistforged' | 'gen1'
  slot?: string            // armor slot (Helm/Shoulders/…) or weapon type (Axe/Sword/…)
  weightClass?: string     // armor only; omitted when same across all three weights
  /** IDs of weight-class siblings whose recipe is identical — compiler collapsed them */
  collapsedFrom?: number[]
  rarity: string
  disciplines: string[]
  components: MaterialNode[]
  _meta: {
    generatedAt: string
    recipeSource: string
    gw2efficiencyVersion: string
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function compileItem(
  id: number,
  type: 'armor' | 'weapon',
  setKey: string,
  slot?: string
): Promise<{ id: number; result: CompiledItem; structureKey: string } | null> {
  const meta = await fetchItemDetails(id).catch(() => null)
  const name = meta?.name ?? `Item ${id}`
  console.log(`  → ${name} (${id})`)

  const rawRecipes = await fetchRecipes([id])
  if (!rawRecipes.length) {
    console.warn(`     ⚠ No recipe found on gw2efficiency`)
    return null
  }

  const recipe: GW2ERecipe = pickBestRecipe(rawRecipes)!
  console.log(`     disciplines: ${recipe.disciplines.join(', ')} | top-level components: ${recipe.components?.length ?? 0}`)

  const itemIds = collectItemIds(recipe)
  const [itemMap, currencyMap] = await Promise.all([
    fetchItemDetailsBulk([...itemIds]),
    fetchCurrencies(),
  ])

  const components = (recipe.components ?? []).map(c => convertNode(c, itemMap, currencyMap))

  // For weapons, capture weapon type (Axe, Sword, etc.) as the slot
  const weaponSlot = type === 'weapon' ? (meta?.details?.type ?? undefined) : slot

  const result: CompiledItem = {
    itemId: id,
    name,
    type,
    setKey,
    slot: weaponSlot,
    weightClass: meta?.details?.weight_class,
    rarity: meta?.rarity ?? 'Legendary',
    disciplines: recipe.disciplines,
    components,
    _meta: {
      generatedAt:            new Date().toISOString(),
      recipeSource:           'gw2efficiency',
      gw2efficiencyVersion:   '2024-07-20T01:00:00.000Z',
    },
  }

  return { id, result, structureKey: recipeStructureKey(recipe) }
}

async function compileArmorSlot(
  slotKey: string,
  slotDef: { ids: number[]; slot: string },
  setKey: string
) {
  console.log(`\n▸ Armor slot: ${slotDef.slot}`)
  const compiled = await Promise.all(
    slotDef.ids.map(id => compileItem(id, 'armor', setKey, slotDef.slot))
  )
  const valid = compiled.filter((x): x is NonNullable<typeof compiled[0]> => x !== null)
  if (!valid.length) return

  const groups = new Map<string, typeof valid>()
  for (const entry of valid) {
    const g = groups.get(entry.structureKey) ?? []
    g.push(entry)
    groups.set(entry.structureKey, g)
  }

  for (const [, group] of groups) {
    const primary  = group[0]
    const siblings = group.slice(1)

    if (siblings.length) {
      primary.result.collapsedFrom = siblings.map(s => s.id)
      const names = group.map(e => e.result.weightClass ?? 'Unknown').filter(Boolean)
      console.log(`     ✓ Identical recipe across: ${names.join(', ')} → using ${primary.result.name} as representative`)
      if (group.length === slotDef.ids.length) delete primary.result.weightClass
    }

    const outPath = path.join(OUTPUT_DIR, `${primary.id}.json`)
    fs.writeFileSync(outPath, JSON.stringify(primary.result, null, 2))
    console.log(`     ✓ Written: ${path.basename(outPath)}`)
  }
}

async function compileArmorSet(
  setMap: Record<string, { ids: number[]; slot: string }>,
  setKey: string,
  label: string
) {
  console.log(`\nCompiling ${label} (deduplicating across weight classes)…`)
  for (const [slotKey, slotDef] of Object.entries(setMap)) {
    await compileArmorSlot(slotKey, slotDef, setKey)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)

  if (args.includes('--clear-cache')) {
    clearCache()
    if (args.length === 1) return
  }

  const armorOnly      = args.includes('--armor-only')
  const weaponsOnly    = args.includes('--weapons-only')
  const obsidianOnly   = args.includes('--obsidian-armor')
  const mistforgedOnly = args.includes('--mistforged-armor')
  const fromCSV        = args.includes('--from-csv')
  const idsArg         = args.find(a => !a.startsWith('--'))

  console.log('╔══════════════════════════════════════╗')
  console.log('║  LeggyTracker — Recipe Compiler      ║')
  console.log('╚══════════════════════════════════════╝\n')

  const allEnvoyIds    = Object.values(ENVOY_ARMOR).flatMap(s => s.ids)
  const allMistIds     = Object.values(MISTFORGED_ARMOR).flatMap(s => s.ids)
  const allObsidianIds = Object.values(OBSIDIAN_ARMOR).flatMap(s => s.ids)

  // ── Envoy Armor ────────────────────────────────────────────────────────────
  if (!weaponsOnly && !obsidianOnly && !mistforgedOnly) {
    if (fromCSV) {
      console.log('Discovering legendary armors from CSV…')
      const csvItems = await findLegendaryItems('Armor')
      console.log(`Found ${csvItems.length} legendary armor items in CSV`)
      for (const item of csvItems) {
        const r = await compileItem(item.id, 'armor', 'csv-armor')
        if (!r) continue
        const outPath = path.join(OUTPUT_DIR, `${r.id}.json`)
        fs.writeFileSync(outPath, JSON.stringify(r.result, null, 2))
        console.log(`  ✓ Written: ${path.basename(outPath)}`)
      }
    } else if (idsArg) {
      const ids = idsArg.split(',').map(Number).filter(Boolean)
      const envoyIds = ids.filter(id => allEnvoyIds.includes(id))
      for (const id of envoyIds) {
        const r = await compileItem(id, 'armor', 'envoy')
        if (!r) continue
        const outPath = path.join(OUTPUT_DIR, `${r.id}.json`)
        fs.writeFileSync(outPath, JSON.stringify(r.result, null, 2))
        console.log(`  ✓ Written: ${path.basename(outPath)}`)
      }
    } else {
      await compileArmorSet(ENVOY_ARMOR, 'envoy', 'Perfected Envoy armor')
    }
  }

  // ── Mistforged Armor ───────────────────────────────────────────────────────
  if (mistforgedOnly || (!weaponsOnly && !obsidianOnly && !armorOnly)) {
    if (idsArg) {
      const ids = idsArg.split(',').map(Number).filter(Boolean)
      for (const id of ids.filter(id => allMistIds.includes(id))) {
        const r = await compileItem(id, 'armor', 'mistforged')
        if (!r) continue
        fs.writeFileSync(path.join(OUTPUT_DIR, `${r.id}.json`), JSON.stringify(r.result, null, 2))
      }
    } else if (!armorOnly) {
      await compileArmorSet(MISTFORGED_ARMOR, 'mistforged', 'Mistforged Triumphant Hero\'s armor')
    }
  }

  // ── Obsidian Armor ─────────────────────────────────────────────────────────
  if (obsidianOnly || (!weaponsOnly && !mistforgedOnly && !armorOnly)) {
    if (idsArg) {
      const ids = idsArg.split(',').map(Number).filter(Boolean)
      for (const id of ids.filter(id => allObsidianIds.includes(id))) {
        const r = await compileItem(id, 'armor', 'obsidian')
        if (!r) continue
        fs.writeFileSync(path.join(OUTPUT_DIR, `${r.id}.json`), JSON.stringify(r.result, null, 2))
      }
    } else if (!armorOnly) {
      await compileArmorSet(OBSIDIAN_ARMOR, 'obsidian', 'Obsidian armor')
    }
  }

  // ── Gen 1 Weapons ──────────────────────────────────────────────────────────
  if (!armorOnly && !obsidianOnly && !mistforgedOnly) {
    let weaponIds = GEN1_WEAPON_IDS
    if (idsArg) {
      const ids = idsArg.split(',').map(Number).filter(Boolean)
      weaponIds = ids.filter(id => GEN1_WEAPON_IDS.includes(id))
    }
    if (fromCSV) {
      const csvItems = await findLegendaryItems('Weapon')
      weaponIds = csvItems.map(i => i.id)
    }

    if (weaponIds.length) {
      console.log(`\n▸ Compiling ${weaponIds.length} gen-1 legendary weapons…`)
      for (const id of weaponIds) {
        const r = await compileItem(id, 'weapon', 'gen1')
        if (!r) continue
        const outPath = path.join(OUTPUT_DIR, `${r.id}.json`)
        fs.writeFileSync(outPath, JSON.stringify(r.result, null, 2))
        console.log(`  ✓ Written: ${path.basename(outPath)}`)
      }
    }
  }

  console.log('\n✓ Done. Run npm run generate:data to update src/data/.')
}

main().catch(err => {
  console.error('\nFatal error:', err)
  process.exit(1)
})
