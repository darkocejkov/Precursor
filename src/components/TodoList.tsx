import { useState, useEffect, useRef } from 'react'

type ResetCycle = 'daily' | 'weekly' | undefined

interface TodoItem {
  id: string
  text: string
  done: boolean
  resetOn?: ResetCycle
  waypoint?: string
}

const TODO_KEY        = 'leggy_todos'
const LAST_DAILY_KEY  = 'leggy_last_daily_reset'
const LAST_WEEKLY_KEY = 'leggy_last_weekly_reset'
const LOCKED_KEY      = 'leggy_todos_locked'

// ── Reset detection ───────────────────────────────────────────────────────────

function lastDailyReset(now: number): number {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function lastWeeklyReset(now: number): number {
  const d = new Date(now)
  const daysBack = (d.getUTCDay() + 6) % 7
  const monday730 = Date.UTC(
    d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysBack, 7, 30
  )
  return monday730 <= now ? monday730 : monday730 - 7 * 86_400_000
}

function applyResets(items: TodoItem[]): { items: TodoItem[]; changed: boolean } {
  const now       = Date.now()
  const curDaily  = lastDailyReset(now)
  const curWeekly = lastWeeklyReset(now)
  const prevDaily  = parseInt(localStorage.getItem(LAST_DAILY_KEY)  ?? '0')
  const prevWeekly = parseInt(localStorage.getItem(LAST_WEEKLY_KEY) ?? '0')

  const dailyFired  = curDaily  > prevDaily
  const weeklyFired = curWeekly > prevWeekly
  if (dailyFired)  localStorage.setItem(LAST_DAILY_KEY,  String(curDaily))
  if (weeklyFired) localStorage.setItem(LAST_WEEKLY_KEY, String(curWeekly))
  if (!dailyFired && !weeklyFired) return { items, changed: false }

  let changed = false
  const next = items.map(item => {
    if (!item.done) return item
    if ((item.resetOn === 'daily' && dailyFired) || (item.resetOn === 'weekly' && weeklyFired)) {
      changed = true
      return { ...item, done: false }
    }
    return item
  })
  return { items: next, changed }
}

// ── Persistence ───────────────────────────────────────────────────────────────

function load(): TodoItem[] {
  try { return JSON.parse(localStorage.getItem(TODO_KEY) ?? '[]') }
  catch { return [] }
}
function persist(items: TodoItem[]) {
  localStorage.setItem(TODO_KEY, JSON.stringify(items))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TodoList() {
  const [items, setItems] = useState<TodoItem[]>(() => {
    const loaded = load()
    const { items: reset, changed } = applyResets(loaded)
    if (changed) persist(reset)
    return reset
  })
  const [draft,   setDraft]   = useState('')
  const [locked,  setLocked]  = useState(() => localStorage.getItem(LOCKED_KEY) === 'true')
  const [draggedId,  setDraggedId]  = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [editingWpId,  setEditingWpId]  = useState<string | null>(null)
  const [wpDraft,      setWpDraft]      = useState('')
  const [copiedId,     setCopiedId]     = useState<string | null>(null)
  const wpInputRef     = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setItems(prev => {
        const { items: next, changed } = applyResets(prev)
        if (!changed) return prev
        persist(next)
        return next
      })
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (editingWpId) wpInputRef.current?.focus()
  }, [editingWpId])

  function update(next: TodoItem[]) { setItems(next); persist(next) }

  function toggleLocked() {
    const next = !locked
    setLocked(next)
    localStorage.setItem(LOCKED_KEY, String(next))
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  function add(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    update([{ id: crypto.randomUUID(), text, done: false, resetOn: 'daily' }, ...items])
    setDraft('')
  }

  function toggle(id: string) {
    update(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  function remove(id: string) { update(items.filter(i => i.id !== id)) }

  function setReset(id: string, cycle: ResetCycle) {
    update(items.map(i => i.id === id ? { ...i, resetOn: cycle } : i))
  }

  function clearDone() { update(items.filter(i => !i.done)) }

  // ── Import / Export ───────────────────────────────────────────────────────

  function exportTodos() {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `leggy-todos-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!Array.isArray(parsed)) throw new Error()
        const valid: TodoItem[] = parsed.filter(
          (x: unknown) =>
            x !== null &&
            typeof x === 'object' &&
            typeof (x as TodoItem).id   === 'string' &&
            typeof (x as TodoItem).text === 'string' &&
            typeof (x as TodoItem).done === 'boolean'
        )
        update(valid)
      } catch {
        alert('Could not import — file must be a valid LeggyTracker JSON export.')
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  // ── Waypoint ──────────────────────────────────────────────────────────────

  function startEditWp(item: TodoItem) {
    setEditingWpId(item.id)
    setWpDraft(item.waypoint ?? '')
  }

  function saveWp(id: string) {
    const code = wpDraft.trim()
    update(items.map(i => i.id === id ? { ...i, waypoint: code || undefined } : i))
    setEditingWpId(null)
    setWpDraft('')
  }

  function cancelWp() { setEditingWpId(null); setWpDraft('') }

  async function copyWp(itemId: string, code: string) {
    await navigator.clipboard.writeText(`/me ${code}`)
    setCopiedId(itemId)
    setTimeout(() => setCopiedId(null), 1500)
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────

  function onDragStart(id: string) { if (!locked) setDraggedId(id) }

  function onDragOver(e: React.DragEvent, id: string) {
    e.preventDefault()
    if (id !== dragOverId) setDragOverId(id)
  }

  function onDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) { clearDrag(); return }
    const next = [...items]
    const from = next.findIndex(i => i.id === draggedId)
    const to   = next.findIndex(i => i.id === targetId)
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    update(next)
    clearDrag()
  }

  function clearDrag() { setDraggedId(null); setDragOverId(null) }

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderWaypoint(item: TodoItem) {
    if (editingWpId === item.id) {
      return (
        <div className="wp-editor">
          <input
            ref={wpInputRef}
            className="wp-input"
            value={wpDraft}
            onChange={e => setWpDraft(e.target.value)}
            placeholder="[&BIOCAAA=]"
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.preventDefault(); saveWp(item.id) }
              if (e.key === 'Escape') cancelWp()
            }}
          />
          <button className="wp-action confirm" onClick={() => saveWp(item.id)}>✓</button>
          <button className="wp-action cancel"  onClick={cancelWp}>✕</button>
        </div>
      )
    }

    if (item.waypoint) {
      return (
        <div className="wp-badge">
          {!locked && (
            <button className="wp-code" onClick={() => startEditWp(item)} title="Edit waypoint">
              {item.waypoint}
            </button>
          )}
          {locked && <span className="wp-code">{item.waypoint}</span>}
          <button
            className={`wp-copy${copiedId === item.id ? ' copied' : ''}`}
            onClick={() => copyWp(item.id, item.waypoint!)}
            title={`Copy: /me ${item.waypoint}`}
          >
            {copiedId === item.id ? '✓' : '⎘'}
          </button>
        </div>
      )
    }

    if (!locked) {
      return (
        <button className="wp-add" onClick={() => startEditWp(item)} title="Add waypoint">
          + WP
        </button>
      )
    }

    return null
  }

  function renderItem(item: TodoItem) {
    const dragging = item.id === draggedId
    const dragOver = item.id === dragOverId && !dragging

    return (
      <li
        key={item.id}
        className={[
          'todo-item',
          item.done ? 'done'      : '',
          dragging  ? 'dragging'  : '',
          dragOver  ? 'drag-over' : '',
        ].filter(Boolean).join(' ')}
        draggable={!locked}
        onDragStart={() => onDragStart(item.id)}
        onDragOver={e  => onDragOver(e, item.id)}
        onDrop={()     => onDrop(item.id)}
        onDragEnd={clearDrag}
      >
        {!locked && <span className="todo-grip" aria-hidden>⠿</span>}

        <button className="todo-check" onClick={() => toggle(item.id)} aria-label="Toggle done">
          <span className={`todo-check-box${item.done ? ' checked' : ''}`}>
            {item.done ? '✓' : ''}
          </span>
        </button>

        <span className="todo-text">{item.text}</span>

        {renderWaypoint(item)}

        {!locked && (
          <div className={`reset-toggle${item.resetOn ? ` has-reset ${item.resetOn}` : ''}`}>
            <button
              className={`reset-btn daily${item.resetOn === 'daily' ? ' active' : ''}`}
              onClick={() => setReset(item.id, item.resetOn === 'daily' ? undefined : 'daily')}
              title="Reset daily at 00:00 UTC"
            >D</button>
            <button
              className={`reset-btn weekly${item.resetOn === 'weekly' ? ' active' : ''}`}
              onClick={() => setReset(item.id, item.resetOn === 'weekly' ? undefined : 'weekly')}
              title="Reset weekly Mon 07:30 UTC"
            >W</button>
          </div>
        )}

        {locked && item.resetOn && (
          <span className={`reset-badge-static ${item.resetOn}`}>
            {item.resetOn === 'daily' ? 'D' : 'W'}
          </span>
        )}

        {!locked && (
          <button className="todo-delete" onClick={() => remove(item.id)} aria-label="Delete">✕</button>
        )}
      </li>
    )
  }

  const active = items.filter(i => !i.done)
  const done   = items.filter(i =>  i.done)

  return (
    <div className={`todo-view${locked ? ' locked' : ''}`}>
      <div className="todo-header">
        <h2>To-Do</h2>
        <span className="todo-count">{active.length} remaining</span>
        <div className="todo-header-spacer" />
        <div className="todo-header-actions">
          <button className="btn-ghost" onClick={exportTodos} title="Export to JSON">
            Export
          </button>
          <button className="btn-ghost" onClick={() => importInputRef.current?.click()} title="Import from JSON">
            Import
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button
            className={`todo-lock-btn${locked ? ' locked' : ''}`}
            onClick={toggleLocked}
            title={locked ? 'Unlock editing' : 'Lock editing'}
          >
            {locked ? '🔒 Locked' : '✏️ Editing'}
          </button>
        </div>
      </div>

      {!locked && (
        <form className="todo-form" onSubmit={add}>
          <input
            className="todo-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add a task…  e.g. Farm 250 Vicious Fangs"
          />
          <button className="btn-primary" type="submit" disabled={!draft.trim()}>Add</button>
        </form>
      )}

      {active.length === 0 && done.length === 0 && (
        <p className="todo-empty">No tasks yet. {locked ? 'Unlock editing to add some.' : 'Add something above to get started.'}</p>
      )}

      {active.length > 0 && (
        <ul className="todo-list">{active.map(renderItem)}</ul>
      )}

      {done.length > 0 && (
        <div className="todo-done-section">
          <div className="todo-done-header">
            <span>Done ({done.length})</span>
            {!locked && <button className="btn-ghost" onClick={clearDone}>Clear all</button>}
          </div>
          <ul className="todo-list done">{done.map(renderItem)}</ul>
        </div>
      )}
    </div>
  )
}
