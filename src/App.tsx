import { useState, useEffect, useCallback } from 'react'
import { NavLink, Routes, Route, Navigate, useMatch } from 'react-router-dom'
import type { Category, LegendaryItem, PlayerInventory } from './types'
import { LEGENDARY_ARMORS } from './data/legendary-armors'
import { LEGENDARY_WEAPONS } from './data/legendary-weapons'
import { LEGENDARY_ACCESSORIES } from './data/legendary-accessories'
import { fetchInventory, fetchLegendaryArmory } from './services/gw2-api'
import { ProgressRing, computeItemProgress } from './components/ProgressRing'
import { ApiKeyInput } from './components/ApiKeyInput'
import { CategorySelector } from './components/CategorySelector'
import { LegendaryDetail } from './components/LegendaryDetail'
import { ResetTimers } from './components/ResetTimers'
import { TaskList } from './components/TaskList'
import { VendorList } from './components/VendorList'
import { DailiesView } from './components/DailiesView'
import { Marquee } from './components/Marquee'

function groupBySubtype(items: LegendaryItem[]) {
  const map = new Map<string, LegendaryItem[]>()
  for (const item of items) {
    const group = map.get(item.subtype) ?? []
    group.push(item)
    map.set(item.subtype, group)
  }
  return Array.from(map.entries()).map(([subtype, items]) => ({ subtype, items }))
}

const STORAGE_KEY = 'precursor_api_key'
const ACCOUNT_KEY = 'precursor_account_name'

function navClass({ isActive }: { isActive: boolean }) {
  return `nav-tab${isActive ? ' active' : ''}`
}

export default function App() {
  const onLegendaries = useMatch('/legendaries')

  const [apiKey,          setApiKey]          = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [accountName,     setAccountName]     = useState<string | null>(() => localStorage.getItem(ACCOUNT_KEY))
  const [category,        setCategory]        = useState<Category>('armor')
  const [selectedId,      setSelectedId]      = useState<string | null>(null)
  const [inventory,       setInventory]       = useState<PlayerInventory | null>(null)
  const [armory,          setArmory]          = useState<Set<number> | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError,  setInventoryError]  = useState<string | null>(null)

  const items        = category === 'armor' ? LEGENDARY_ARMORS : category === 'weapon' ? LEGENDARY_WEAPONS : LEGENDARY_ACCESSORIES as LegendaryItem[]
  const selectedItem = items.find(i => i.id === selectedId) ?? items[0] ?? null

  const loadInventory = useCallback(async (key: string) => {
    if (!key) return
    setInventoryLoading(true)
    setInventoryError(null)
    try {
      const [inv, arm] = await Promise.all([
        fetchInventory(key),
        fetchLegendaryArmory(key).catch(() => new Set<number>()),
      ])
      setInventory(inv)
      setArmory(arm)
    } catch (err) {
      setInventoryError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setInventoryLoading(false)
    }
  }, [])

  useEffect(() => {
    if (apiKey) loadInventory(apiKey)
  }, [apiKey, loadInventory])

  function handleSaveKey(key: string, name: string) {
    localStorage.setItem(STORAGE_KEY, key)
    localStorage.setItem(ACCOUNT_KEY, name)
    setApiKey(key)
    setAccountName(name)
  }

  function handleClear() {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ACCOUNT_KEY)
    setApiKey('')
    setAccountName(null)
    setInventory(null)
    setArmory(null)
  }

  function isOwned(item: LegendaryItem): boolean {
    if (!armory || !item.legendaryItemIds?.length) return false
    return item.legendaryItemIds.every(id => armory.has(id))
  }

  function getProgress(item: LegendaryItem): number {
    if (!inventory) return 0
    return computeItemProgress(item.components, inventory)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-gem">◆</span>
            <span className="logo-text">Precursor</span>
          </div>
        </div>

        <nav className="app-nav">
          <NavLink to="/legendaries" className={navClass}>Legendaries</NavLink>
          <NavLink to="/vendors"     className={navClass}>Vendors</NavLink>
          <NavLink to="/dailies"     className={navClass}>Dailies</NavLink>
          <NavLink to="/weeklies"    className={navClass}>Weeklies</NavLink>
        </nav>

        <ResetTimers />
      </header>

      <Marquee />

      <main className="app-main">
        {onLegendaries && (
          <aside className="sidebar">
            <div className="sidebar-scroll">
              {inventoryLoading && <p className="loading-text">Loading inventory…</p>}
              {inventoryError   && <p className="error-text">{inventoryError}</p>}

              <CategorySelector active={category} onChange={c => { setCategory(c); setSelectedId(null) }} />

              <ul className="item-list">
                {groupBySubtype(items).map(({ subtype, items: group }) => (
                  <li key={subtype}>
                    <p className="item-group-label">{subtype}</p>
                    <ul>
                      {group.map(item => {
                        const owned = isOwned(item)
                        const pct   = owned ? 1 : getProgress(item)
                        return (
                          <li key={item.id}>
                            <button
                              className={`item-btn${item.isFullSet ? ' full-set' : ''}${selectedItem?.id === item.id ? ' active' : ''}${owned ? ' owned' : ''}`}
                              onClick={() => setSelectedId(item.id)}
                            >
                              <ProgressRing pct={pct} owned={owned} />
                              <span className="item-btn-label">
                                {item.isFullSet ? '◆ ' : ''}{item.name}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>

            <div className="sidebar-footer">
              <ApiKeyInput
                apiKey={apiKey}
                accountName={accountName}
                onSave={handleSaveKey}
                onClear={handleClear}
              />
            </div>
          </aside>
        )}

        <section className="content">
          <Routes>
            <Route path="/"            element={<Navigate to="/legendaries" replace />} />
            <Route path="/legendaries" element={
              selectedItem
                ? <LegendaryDetail key={selectedItem.id} item={selectedItem} inventory={inventory} />
                : <p className="placeholder-text">Select a legendary item from the list.</p>
            } />
            <Route path="/vendors"  element={<VendorList />} />
            <Route path="/dailies"  element={<DailiesView />} />
            <Route path="/weeklies" element={<TaskList cycle="weekly" />} />
          </Routes>
        </section>
      </main>
    </div>
  )
}
