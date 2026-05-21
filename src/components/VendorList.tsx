import { useState, useEffect, useCallback } from 'react'
import { VENDORS } from '../data/vendors'
import {
  VENDOR_PRODUCT_ITEM_IDS,
  fetchItemIconsBatch,
  fetchCurrencyIconsBatch,
} from '../services/item-icons'

// ── Cost parsing ──────────────────────────────────────────────────────────────

interface CostPart { amount: number; name: string }

const COST_LOOKUP: Record<string, { type: 'currency' | 'item'; id: number }> = {
  'Fractal Relics':              { type: 'currency', id: 7  },
  'Fractal Relic':               { type: 'currency', id: 7  },
  'Badges of Honor':             { type: 'currency', id: 15 },
  'Badge of Honor':              { type: 'currency', id: 15 },
  'Badges':                      { type: 'currency', id: 15 },
  'Badge':                       { type: 'currency', id: 15 },
  'Skirmish Tickets':            { type: 'currency', id: 26 },
  'Skirmish Ticket':             { type: 'currency', id: 26 },
  'Spirit Shards':               { type: 'currency', id: 23 },
  'Spirit Shard':                { type: 'currency', id: 23 },
  'Magnetite Shards':            { type: 'currency', id: 28 },
  'Magnetite Shard':             { type: 'currency', id: 28 },
  'Astral Acclaim':              { type: 'currency', id: 63 },
  'Testimony of Jade Heroics':   { type: 'currency', id: 65 },
  'PvP Tickets':                 { type: 'currency', id: 30 },
  'PvP Ticket':                  { type: 'currency', id: 30 },
  'Shards of Glory':             { type: 'currency', id: 33 },
  'Shard of Glory':              { type: 'currency', id: 33 },
  'Globs':                       { type: 'item',     id: 19721 },
  'Glob':                        { type: 'item',     id: 19721 },
  'Globs of Ecto':               { type: 'item',     id: 19721 },
  'Glob of Ecto':                { type: 'item',     id: 19721 },
  'Glob of Ectoplasm':           { type: 'item',     id: 19721 },
  'Mystic Coins':                { type: 'item',     id: 19976 },
  'Mystic Coin':                 { type: 'item',     id: 19976 },
  'Obsidian Shards':             { type: 'item',     id: 19925 },
  'Obsidian Shard':              { type: 'item',     id: 19925 },
  'Vision Crystal':              { type: 'item',     id: 46746 },
  'Memory of Battle':            { type: 'item',     id: 71581 },
  'Memories of Battle':          { type: 'item',     id: 71581 },
  'Bauble Bubbles':                   { type: 'item',     id: 41886 },
  'Bauble Bubble':                    { type: 'item',     id: 41886 },
  'Emblem of Tournament Victory':     { type: 'item',     id: 93012 },
}

const COST_CURRENCY_IDS = [7, 15, 23, 26, 28, 30, 33, 63, 65]
const COST_ITEM_IDS     = [19675, 19721, 19925, 19976, 46746, 71581, 41886, 93012]

const COIN_ICONS = {
  gold:   'https://wiki.guildwars2.com/images/thumb/d/d1/Gold_coin.png/18px-Gold_coin.png',
  silver: 'https://wiki.guildwars2.com/images/thumb/3/3c/Silver_coin.png/18px-Silver_coin.png',
  copper: 'https://wiki.guildwars2.com/images/thumb/e/eb/Copper_coin.png/18px-Copper_coin.png',
}

const COIN_VALUES: Record<string, number> = {
  'Gold': 10000, 'Gold Coin': 10000,
  'Silver': 100, 'Silver Coin': 100,
  'Copper': 1,   'Copper Coin': 1,
}

function parseCostParts(cost: string): { parts: CostPart[]; perUnit: boolean } {
  const perUnit = /\beach\b/i.test(cost)
  const cleaned = cost.replace(/\s*\beach\b\s*/gi, '').trim()
  const parts: CostPart[] = cleaned.split(/\s*\+\s*/).flatMap(seg => {
    const m = seg.match(/^(\d+)\s+(.+)$/)
    return m ? [{ amount: parseInt(m[1]), name: m[2].trim() }] : []
  })
  return { parts, perUnit }
}

function CoinDisplay({ copper }: { copper: number }) {
  const g = Math.floor(copper / 10000)
  const s = Math.floor((copper % 10000) / 100)
  const c = copper % 100
  return (
    <span className="cost-component cost-coins">
      {g > 0 && <><span className="cost-amount">{g}</span><img src={COIN_ICONS.gold}   className="cost-coin" alt="gold"   title="Gold" /></>}
      {s > 0 && <><span className="cost-amount">{s}</span><img src={COIN_ICONS.silver} className="cost-coin" alt="silver" title="Silver" /></>}
      {c > 0 && <><span className="cost-amount">{c}</span><img src={COIN_ICONS.copper} className="cost-coin" alt="copper" title="Copper" /></>}
    </span>
  )
}

function CostCell({ cost, multiplier, currIcons, itemIcons }: {
  cost: string
  multiplier: number
  currIcons: Map<number, string>
  itemIcons: Map<number, string>
}) {
  if (multiplier === 0) return <span className="cost-done">—</span>
  const { parts } = parseCostParts(cost)
  if (!parts.length) return <span className="cost-name">{cost.replace(/\s*each\s*$/i, '')}</span>

  // Separate coin parts from other parts
  let totalCopper = 0
  const nonCoinParts: CostPart[] = []
  for (const p of parts) {
    const coinVal = COIN_VALUES[p.name]
    if (coinVal !== undefined) totalCopper += p.amount * multiplier * coinVal
    else nonCoinParts.push(p)
  }

  return (
    <div className="cost-inline">
      {nonCoinParts.map((p, i) => {
        const entry = COST_LOOKUP[p.name]
        const icon  = entry
          ? (entry.type === 'currency' ? currIcons.get(entry.id) : itemIcons.get(entry.id))
          : undefined
        const total = p.amount * multiplier
        return (
          <span key={i} className="cost-component">
            {i > 0 && <span className="cost-plus">+</span>}
            {icon
              ? <img src={icon} className="cost-icon" alt={p.name} title={p.name} />
              : <span className="cost-name">{p.name}</span>
            }
            <span className="cost-amount">{total.toLocaleString()}</span>
          </span>
        )
      })}
      {totalCopper > 0 && (
        <>
          {nonCoinParts.length > 0 && <span className="cost-plus">+</span>}
          <CoinDisplay copper={totalCopper} />
        </>
      )}
    </div>
  )
}

// ── Limit / reset logic ───────────────────────────────────────────────────────

type Cycle  = 'daily' | 'weekly' | 'season' | null
type Counts = Record<string, number>

function parseLimitStr(limitStr?: string): { max: number; cycle: Cycle } {
  if (!limitStr || limitStr === 'unlimited') return { max: Infinity, cycle: null }
  const m = limitStr.match(/^(\d+)\s+(daily|weekly|per\s+season)/)
  if (!m) return { max: Infinity, cycle: null }
  const raw = m[2].trim()
  return {
    max:   parseInt(m[1]),
    cycle: raw === 'daily' ? 'daily' : raw === 'weekly' ? 'weekly' : 'season',
  }
}

function lastDailyReset(now: number) {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function lastWeeklyReset(now: number) {
  const d    = new Date(now)
  const back = (d.getUTCDay() + 6) % 7
  const mon  = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - back, 7, 30)
  return mon <= now ? mon : mon - 7 * 86_400_000
}

const BUYS_KEY   = 'precursor_vendor_buys'
const DAILY_KEY  = 'precursor_vendor_daily'
const WEEKLY_KEY = 'precursor_vendor_weekly'

function loadCounts(): Counts {
  try {
    const now = Date.now()
    let counts: Counts = JSON.parse(localStorage.getItem(BUYS_KEY) ?? '{}')
    const curD = lastDailyReset(now), curW = lastWeeklyReset(now)
    const prevD = parseInt(localStorage.getItem(DAILY_KEY)  ?? '0')
    const prevW = parseInt(localStorage.getItem(WEEKLY_KEY) ?? '0')
    let changed = false
    if (curD > prevD) {
      localStorage.setItem(DAILY_KEY, String(curD))
      for (const [vi, vendor] of VENDORS.entries())
        for (const [pi, p] of vendor.products.entries())
          if (parseLimitStr(p.limitStr).cycle === 'daily') { delete counts[`${vi}:${pi}`]; changed = true }
    }
    if (curW > prevW) {
      localStorage.setItem(WEEKLY_KEY, String(curW))
      for (const [vi, vendor] of VENDORS.entries())
        for (const [pi, p] of vendor.products.entries())
          if (parseLimitStr(p.limitStr).cycle === 'weekly') { delete counts[`${vi}:${pi}`]; changed = true }
    }
    if (changed) localStorage.setItem(BUYS_KEY, JSON.stringify(counts))
    return counts
  } catch { return {} }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function VendorList() {
  const [counts,    setCounts]    = useState<Counts>(loadCounts)
  const [currIcons, setCurrIcons] = useState<Map<number, string>>(new Map())
  const [itemIcons, setItemIcons] = useState<Map<number, string>>(new Map())
  const [copiedWp,  setCopiedWp]  = useState<string | null>(null)

  async function copyWaypoint(wp: string) {
    await navigator.clipboard.writeText(`/me ${wp}`)
    setCopiedWp(wp)
    setTimeout(() => setCopiedWp(null), 1500)
  }

  useEffect(() => {
    fetchCurrencyIconsBatch(COST_CURRENCY_IDS).then(setCurrIcons)
    const ids = [...new Set([...Object.values(VENDOR_PRODUCT_ITEM_IDS), ...COST_ITEM_IDS])]
    fetchItemIconsBatch(ids).then(setItemIcons)
  }, [])

  const save = useCallback((next: Counts) => {
    setCounts(next)
    localStorage.setItem(BUYS_KEY, JSON.stringify(next))
  }, [])

  function stepSize(e: React.MouseEvent): number {
    if (e.shiftKey) return 10
    if (e.ctrlKey)  return 5
    return 1
  }

  function setCount(vi: number, pi: number, value: number, max: number) {
    const key  = `${vi}:${pi}`
    const next = { ...counts }
    const v = Math.max(0, isFinite(max) ? Math.min(max, value) : value)
    if (v <= 0) delete next[key]; else next[key] = v
    save(next)
  }

  function toggle(vi: number, pi: number, max: number) {
    const cur    = counts[`${vi}:${pi}`] ?? 0
    const target = isFinite(max) ? max : 1
    setCount(vi, pi, cur >= target ? 0 : target, max)
  }

  return (
    <div className="task-list-view">
      <div className="todo-header">
        <h2>Vendors</h2>
        <span className="todo-count">{VENDORS.length} vendors</span>
      </div>

      <div className="vendor-cards">
        {VENDORS.map((vendor, vi) => {
          const hasLimit = vendor.products.some(p => isFinite(parseLimitStr(p.limitStr).max))
          return (
            <div key={vendor.name} className="vendor-card">
              <div className="vendor-card-header">
                <div className="vendor-header-left">
                  {vendor.url
                    ? <a href={vendor.url} target="_blank" rel="noreferrer"
                        className="vendor-card-name">{vendor.name}</a>
                    : <span className="vendor-card-name">{vendor.name}</span>
                  }
                  {vendor.subtitle && (
                    <span className="vendor-subtitle">{vendor.subtitle}</span>
                  )}
                </div>
                {vendor.waypoint && (
                  <button
                    className={`vendor-wp-btn${copiedWp === vendor.waypoint ? ' copied' : ''}`}
                    onClick={() => copyWaypoint(vendor.waypoint!)}
                    title={`Copy waypoint: ${vendor.waypoint}`}
                  >
                    {copiedWp === vendor.waypoint ? '✓' : '⊕'} {vendor.waypoint}
                  </button>
                )}
              </div>

              {vendor.notes && vendor.notes.length > 0 && (
                <ul className="vendor-notes">
                  {vendor.notes.map(note => <li key={note}>{note}</li>)}
                </ul>
              )}

              {vendor.products.length > 0 && (
                <table className="vendor-products">
                  <thead>
                    <tr>
                      <th>Item</th>
                      {hasLimit && <th>Progress</th>}
                      <th>Cost</th>
                      {hasLimit && <th>Total Remaining</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {vendor.products.map((p, pi) => {
                      const { max }   = parseLimitStr(p.limitStr)
                      const bought    = counts[`${vi}:${pi}`] ?? 0
                      const finite    = isFinite(max)
                      const done      = finite ? bought >= max : false
                      const remaining = finite ? max - bought : 0
                      const itemId    = VENDOR_PRODUCT_ITEM_IDS[p.name]
                      const icon      = itemId !== undefined ? itemIcons.get(itemId) : undefined
                      const { perUnit } = parseCostParts(p.cost)
                      // For "each" items multiply by remaining; for bundle items show once if not done
                      const totalMult = finite
                        ? (perUnit ? remaining : (remaining > 0 ? 1 : 0))
                        : 0

                      return (
                        <tr key={pi} className={done ? 'vendor-row-done' : ''}>
                          <td>
                            <div className="vendor-product-name">
                              {icon && <img src={icon} className="vendor-product-icon" alt={p.name} />}
                              <span>{p.name}</span>
                            </div>
                          </td>

                          {hasLimit && (
                            <td>
                              {finite && (
                                <div className="vendor-progress">
                                  <button className={`vendor-toggle${done ? ' done' : ''}`}
                                    onClick={() => toggle(vi, pi, max)}
                                    title={done ? 'Unmark' : 'Mark as done'}>
                                    {done ? '✓' : ''}
                                  </button>
                                  <span className="vendor-count">{bought} / {max}</span>
                                  <button className="vendor-adj"
                                    onClick={e => setCount(vi, pi, bought - stepSize(e), max)}
                                    disabled={bought === 0}
                                    title="−1  ·  Ctrl: −5  ·  Shift: −10">−</button>
                                  <button className="vendor-adj"
                                    onClick={e => setCount(vi, pi, bought + stepSize(e), max)}
                                    disabled={bought >= max}
                                    title="+1  ·  Ctrl: +5  ·  Shift: +10">+</button>
                                </div>
                              )}
                            </td>
                          )}

                          <td>
                            <CostCell cost={p.cost} multiplier={1}
                              currIcons={currIcons} itemIcons={itemIcons} />
                          </td>

                          {hasLimit && (
                            <td>
                              {finite && (
                                <CostCell cost={p.cost} multiplier={totalMult}
                                  currIcons={currIcons} itemIcons={itemIcons} />
                              )}
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {vendor.subVendors && vendor.subVendors.length > 0 && (
                <ul className="vendor-subvendors">
                  {vendor.subVendors.map(sv => (
                    <li key={sv.name} className="vendor-subvendor">
                      <span className="vendor-subvendor-name">{sv.name}</span>
                      {sv.waypoint && (
                        <button
                          className={`vendor-wp-btn${copiedWp === sv.waypoint ? ' copied' : ''}`}
                          onClick={() => copyWaypoint(sv.waypoint!)}
                          title={`Copy waypoint: ${sv.waypoint}`}
                        >
                          {copiedWp === sv.waypoint ? '✓' : '⊕'} {sv.waypoint}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
