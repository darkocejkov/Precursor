import { useState, useEffect, useRef } from 'react'
import { WEEKLY_SECTIONS } from '../data/weeklies'

interface TaskItem {
  id: string
  text: string
  done: boolean
  waypoint?: string
}

function lastDailyReset(now: number): number {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function lastWeeklyReset(now: number): number {
  const d = new Date(now)
  const daysBack = (d.getUTCDay() + 6) % 7
  const monday730 = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - daysBack, 7, 30)
  return monday730 <= now ? monday730 : monday730 - 7 * 86_400_000
}

function getLastReset(cycle: 'daily' | 'weekly', now: number) {
  return cycle === 'daily' ? lastDailyReset(now) : lastWeeklyReset(now)
}

function loadItems(itemsKey: string, resetKey: string, cycle: 'daily' | 'weekly'): TaskItem[] {
  try {
    const now  = Date.now()
    const cur  = getLastReset(cycle, now)
    const prev = parseInt(localStorage.getItem(resetKey) ?? '0')
    const raw: TaskItem[] = JSON.parse(localStorage.getItem(itemsKey) ?? '[]')
    const items = Array.isArray(raw) ? raw : []
    if (cur > prev) {
      localStorage.setItem(resetKey, String(cur))
      const reset = items.map(i => ({ ...i, done: false }))
      localStorage.setItem(itemsKey, JSON.stringify(reset))
      return reset
    }
    return items
  } catch {
    return []
  }
}

export function TaskList({ cycle }: { cycle: 'daily' | 'weekly' }) {
  const ITEMS_KEY = `precursor_${cycle}s`
  const RESET_KEY = `precursor_${cycle}s_reset`

  const [items,       setItems]       = useState<TaskItem[]>(() => loadItems(ITEMS_KEY, RESET_KEY, cycle))
  const [draft,       setDraft]       = useState('')
  const [editingWpId, setEditingWpId] = useState<string | null>(null)
  const [wpDraft,     setWpDraft]     = useState('')
  const [copiedId,    setCopiedId]    = useState<string | null>(null)
  const wpInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setItems(prev => {
        const now  = Date.now()
        const cur  = getLastReset(cycle, now)
        const prev_ = parseInt(localStorage.getItem(RESET_KEY) ?? '0')
        if (cur <= prev_) return prev
        localStorage.setItem(RESET_KEY, String(cur))
        const next = prev.map(i => ({ ...i, done: false }))
        localStorage.setItem(ITEMS_KEY, JSON.stringify(next))
        return next
      })
    }, 30_000)
    return () => clearInterval(id)
  }, [cycle, ITEMS_KEY, RESET_KEY])

  useEffect(() => {
    if (editingWpId) wpInputRef.current?.focus()
  }, [editingWpId])

  function update(next: TaskItem[]) {
    setItems(next)
    localStorage.setItem(ITEMS_KEY, JSON.stringify(next))
  }

  function add(e: React.FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    update([{ id: crypto.randomUUID(), text, done: false }, ...items])
    setDraft('')
  }

  function toggle(id: string) {
    update(items.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  function remove(id: string) { update(items.filter(i => i.id !== id)) }

  function startEditWp(item: TaskItem) { setEditingWpId(item.id); setWpDraft(item.waypoint ?? '') }
  function cancelWp() { setEditingWpId(null); setWpDraft('') }

  function saveWp(id: string) {
    const code = wpDraft.trim()
    update(items.map(i => i.id === id ? { ...i, waypoint: code || undefined } : i))
    setEditingWpId(null)
    setWpDraft('')
  }

  async function copyWp(itemId: string, code: string) {
    await navigator.clipboard.writeText(`/me ${code}`)
    setCopiedId(itemId)
    setTimeout(() => setCopiedId(null), 1500)
  }

  function renderWaypoint(item: TaskItem) {
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
          <button className="wp-code" onClick={() => startEditWp(item)} title="Edit waypoint">
            {item.waypoint}
          </button>
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
    return (
      <button className="wp-add" onClick={() => startEditWp(item)} title="Add waypoint">
        + WP
      </button>
    )
  }

  function renderNote(note: string) {
    const match = note.match(/^(.*?)(https?:\/\/\S+)(.*)$/)
    if (match) return <>{match[1]}<a href={match[2]} target="_blank" rel="noreferrer">{match[2]}</a>{match[3]}</>
    return note
  }

  const active = items.filter(i => !i.done)
  const done   = items.filter(i =>  i.done)
  const title  = cycle === 'daily' ? 'Dailies' : 'Weeklies'

  return (
    <div className="task-list-view">
      <div className="todo-header">
        <h2>{title}</h2>
        <span className="todo-count">{active.length} remaining</span>
      </div>

      {cycle === 'weekly' && (
        <div className="weekly-info-cards">
          {WEEKLY_SECTIONS.map(section => (
            <div key={section.name} className="weekly-info-card">
              <div className="weekly-info-card-header">
                <span className="weekly-info-card-name">{section.name}</span>
                {section.totalAcclaim != null && (
                  <span className="weekly-acclaim">{section.totalAcclaim} Acclaim</span>
                )}
              </div>
              {section.description && <p className="weekly-info-card-desc">{section.description}</p>}
              {section.reward     && <p className="weekly-info-card-reward">{section.reward}</p>}
              {section.notes && section.notes.length > 0 && (
                <div className="weekly-notes">
                  {section.notes.map(note => (
                    <p key={note} className="weekly-note">{renderNote(note)}</p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="custom-tasks-label">Custom Tasks</p>
      <form className="todo-form" onSubmit={add}>
        <input
          className="todo-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={`Add a ${cycle} task…`}
        />
        <button className="btn-primary" type="submit" disabled={!draft.trim()}>Add</button>
      </form>

      {active.length === 0 && done.length === 0 && (
        <p className="todo-empty">No tasks yet. Add something above to get started.</p>
      )}

      {active.length > 0 && (
        <ul className="todo-list">
          {active.map(item => (
            <li key={item.id} className="todo-item">
              <button className="todo-check" onClick={() => toggle(item.id)} aria-label="Toggle done">
                <span className="todo-check-box" />
              </button>
              <span className="todo-text">{item.text}</span>
              {renderWaypoint(item)}
              <button className="todo-delete" onClick={() => remove(item.id)} aria-label="Delete">✕</button>
            </li>
          ))}
        </ul>
      )}

      {done.length > 0 && (
        <div className="todo-done-section">
          <div className="todo-done-header">
            <span>Done ({done.length})</span>
          </div>
          <ul className="todo-list done">
            {done.map(item => (
              <li key={item.id} className="todo-item done">
                <button className="todo-check" onClick={() => toggle(item.id)} aria-label="Toggle done">
                  <span className="todo-check-box checked">✓</span>
                </button>
                <span className="todo-text">{item.text}</span>
                {renderWaypoint(item)}
                <button className="todo-delete" onClick={() => remove(item.id)} aria-label="Delete">✕</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
