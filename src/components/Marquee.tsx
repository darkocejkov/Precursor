import { useState, useEffect } from 'react'
import {
  fetchCurrencyIconsBatch,
  fetchItemIconsBatch,
  CURRENCY_LABELS,
  ITEM_LABELS,
} from '../services/item-icons'

// Grouped by purpose — order within each group reflects typical priority
const CURRENCY_GROUPS: { ids: number[] }[] = [
  { ids: [1, 3, 23, 54] },         // Core: Gold, Laurels, Spirit Shards, Astral Acclaim
  { ids: [7, 24] },                 // Fractal: Fractal Relics, Pristine Relics
  { ids: [4, 15] },                 // WvW: Badges of Honor, WvW Tickets
  { ids: [28] },                    // Raids: Magnetite Shards
  { ids: [18, 45] },                // Open World: Unbound Magic, Volatile Magic
]
const ITEM_GROUP_IDS = [19976, 19675, 19721, 19925] // Crafting: Coins, Clovers, Globs, Obsidian

const ALL_CURRENCY_IDS = CURRENCY_GROUPS.flatMap(g => g.ids)

interface Entry { id: number; label: string; icon: string }

export function Marquee() {
  const [currIcons, setCurrIcons] = useState<Map<number, string>>(new Map())
  const [itemIcons, setItemIcons] = useState<Map<number, string>>(new Map())
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      fetchCurrencyIconsBatch(ALL_CURRENCY_IDS),
      fetchItemIconsBatch(ITEM_GROUP_IDS),
    ]).then(([c, i]) => {
      setCurrIcons(c)
      setItemIcons(i)
      setLoaded(true)
    })
  }, [])

  if (!loaded) return <div className="marquee-bar" />

  // Build display groups: each currency group + one crafting group at the end
  const groups: Entry[][] = CURRENCY_GROUPS.map(g =>
    g.ids
      .filter(id => currIcons.has(id))
      .map(id => ({ id, label: CURRENCY_LABELS[id] ?? `${id}`, icon: currIcons.get(id)! }))
  ).filter(g => g.length > 0)

  const craftingGroup: Entry[] = ITEM_GROUP_IDS
    .filter(id => itemIcons.has(id))
    .map(id => ({ id, label: ITEM_LABELS[id] ?? `${id}`, icon: itemIcons.get(id)! }))

  if (craftingGroup.length > 0) groups.push(craftingGroup)

  type TrackItem = { type: 'entry'; entry: Entry } | { type: 'sep' }

  function buildTrack(): TrackItem[] {
    const track: TrackItem[] = []
    for (let gi = 0; gi < groups.length; gi++) {
      if (gi > 0) track.push({ type: 'sep' })
      for (const entry of groups[gi]) track.push({ type: 'entry', entry })
    }
    return track
  }

  const track  = buildTrack()
  const doubled: TrackItem[] = [...track, { type: 'sep' }, ...track]

  return (
    <div className="marquee-bar">
      <div className="marquee-track">
        {doubled.map((item, i) =>
          item.type === 'sep'
            ? <span key={`sep-${i}`} className="marquee-sep" />
            : (
              <span key={`${item.entry.id}-${i}`} className="marquee-item">
                <img src={item.entry.icon} className="marquee-icon" alt={item.entry.label} />
                <span className="marquee-label">{item.entry.label}</span>
              </span>
            )
        )}
      </div>
    </div>
  )
}
