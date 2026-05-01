#!/usr/bin/env tsx
/**
 * Search the GW2 item master CSV for legendary items by name pattern.
 *
 * Usage:
 *   tsx scripts/search-items.ts mistforged
 *   tsx scripts/search-items.ts obsidian armor
 *   tsx scripts/search-items.ts triumphant
 */

import { loadCSV } from './lib/csv.ts'

const terms = process.argv.slice(2).map(t => t.toLowerCase())
if (!terms.length) {
  console.error('Usage: tsx scripts/search-items.ts <term> [term2...]')
  process.exit(1)
}

const items = await loadCSV()
const results = items.filter(i =>
  i.rarity === 'Legendary' &&
  terms.every(t => i.name.toLowerCase().includes(t) || i.type.toLowerCase().includes(t))
)

console.log(`Found ${results.length} legendary items matching [${terms.join(', ')}]:\n`)
for (const item of results.slice(0, 100)) {
  console.log(`  ${item.id}\t${item.type}\t${item.name}`)
}
