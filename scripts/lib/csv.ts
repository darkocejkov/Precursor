const CSV_URL = 'https://raw.githubusercontent.com/otc-cirdan/gw2-items/refs/heads/master/items.csv'

export interface CSVItem {
  id: number
  name: string
  type: string
  level: number
  rarity: string
  vendor_value: number
}

function parseLine(line: string): CSVItem | null {
  if (!line.trim()) return null
  // Format: id,name,type,level,rarity,vendor_value
  // Name may contain commas — split conservatively from both ends
  const parts = line.split(',')
  if (parts.length < 6) return null
  const id           = parseInt(parts[0])
  const vendor_value = parseInt(parts[parts.length - 1])
  const rarity       = parts[parts.length - 2].trim()
  const level        = parseInt(parts[parts.length - 3])
  const type         = parts[parts.length - 4].trim()
  const name         = parts.slice(1, parts.length - 4).join(',').trim()
  if (isNaN(id)) return null
  return { id, name, type, level, rarity, vendor_value }
}

export async function loadCSV(): Promise<CSVItem[]> {
  process.stdout.write(`  [GET] ${CSV_URL}\n`)
  const res = await fetch(CSV_URL)
  if (!res.ok) throw new Error(`Failed to fetch CSV: HTTP ${res.status}`)
  const text  = await res.text()
  const lines = text.split('\n').slice(1) // skip header
  return lines.map(parseLine).filter((x): x is CSVItem => x !== null)
}

export async function findLegendaryItems(
  type: 'Armor' | 'Weapon',
  items?: CSVItem[]
): Promise<CSVItem[]> {
  const all = items ?? await loadCSV()
  return all.filter(i => i.type === type && i.rarity === 'Legendary')
}
