import { useState, useEffect, useCallback } from 'react'
import type { Category, LegendaryItem, PlayerInventory } from './types'
import { LEGENDARY_ARMORS } from './data/legendary-armors'
import { LEGENDARY_WEAPONS } from './data/legendary-weapons'
import { fetchInventory, fetchLegendaryArmory } from './services/gw2-api'
import { ProgressRing, computeItemProgress } from './components/ProgressRing'
import { ApiKeyInput } from './components/ApiKeyInput'
import { CategorySelector } from './components/CategorySelector'
import { LegendaryDetail } from './components/LegendaryDetail'
import { ResetTimers } from './components/ResetTimers'
import { TodoList } from './components/TodoList'

type View = 'tracker' | 'todo'

function groupBySubtype(items: LegendaryItem[]) {
  const map = new Map<string, LegendaryItem[]>()
  for (const item of items) {
    const group = map.get(item.subtype) ?? []
    group.push(item)
    map.set(item.subtype, group)
  }
  return Array.from(map.entries()).map(([subtype, items]) => ({ subtype, items }))
}

const STORAGE_KEY = 'leggy_api_key'
const ACCOUNT_KEY = 'leggy_account_name'

export default function App() {
  const [view, setView] = useState<View>('tracker')
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(STORAGE_KEY) ?? '')
  const [accountName, setAccountName] = useState<string | null>(() => localStorage.getItem(ACCOUNT_KEY))
  const [category, setCategory] = useState<Category>('armor')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inventory, setInventory] = useState<PlayerInventory | null>(null)
  const [armory, setArmory] = useState<Set<number> | null>(null)
  const [inventoryLoading, setInventoryLoading] = useState(false)
  const [inventoryError, setInventoryError] = useState<string | null>(null)

  const items: LegendaryItem[] = category === 'armor' ? LEGENDARY_ARMORS : LEGENDARY_WEAPONS
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
            <span className="logo-text">LeggyTracker</span>
          </div>
        </div>

        <nav className="app-nav">
          <button
            className={`nav-tab${view === 'tracker' ? ' active' : ''}`}
            onClick={() => setView('tracker')}
          >
            Tracker
          </button>
          <button
            className={`nav-tab${view === 'todo' ? ' active' : ''}`}
            onClick={() => setView('todo')}
          >
            To-Do
          </button>
        </nav>

        <ResetTimers />
      </header>

      <main className="app-main">
        {view === 'tracker' && (
          <aside className="sidebar">
            <ApiKeyInput
              apiKey={apiKey}
              accountName={accountName}
              onSave={handleSaveKey}
              onClear={handleClear}
            />

            {inventoryLoading && <p className="loading-text">Loading inventory…</p>}
            {inventoryError && <p className="error-text">{inventoryError}</p>}

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
          </aside>
        )}

        <section className="content">
          {view === 'tracker'
            ? selectedItem
              ? <LegendaryDetail key={selectedItem.id} item={selectedItem} inventory={inventory} />
              : <p className="placeholder-text">Select a legendary item from the list.</p>
            : <TodoList />
          }
        </section>
      </main>
    </div>
  )
}
