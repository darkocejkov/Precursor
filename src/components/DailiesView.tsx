import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { GATHERING_NODES, estimateVM, nodeKey } from '../data/gathering'
import { DAILY_SECTIONS } from '../data/dailies'
import { PARKING_GROUPS } from '../data/parking'
import { MATERIAL_ITEM_IDS, fetchItemIconsBatch } from '../services/item-icons'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskItem {
  id: string
  text: string
  done: boolean
  waypoint?: string
}

// ── Storage keys ──────────────────────────────────────────────────────────────

const TASKS_KEY    = 'precursor_dailies'
const TASKS_RESET  = 'precursor_dailies_reset'
const GATHER_KEY   = 'precursor_gathering_done'
const GATHER_RESET = 'precursor_gathering_last_reset'

// ── Reset helpers ─────────────────────────────────────────────────────────────

function lastDailyReset(now: number): number {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

// ── Loaders ───────────────────────────────────────────────────────────────────

function loadTasks(): TaskItem[] {
  try {
    const now  = Date.now()
    const cur  = lastDailyReset(now)
    const prev = parseInt(localStorage.getItem(TASKS_RESET) ?? '0')
    const raw: TaskItem[] = JSON.parse(localStorage.getItem(TASKS_KEY) ?? '[]')
    const items = Array.isArray(raw) ? raw : []
    if (cur > prev) {
      localStorage.setItem(TASKS_RESET, String(cur))
      const reset = items.map(i => ({ ...i, done: false }))
      localStorage.setItem(TASKS_KEY, JSON.stringify(reset))
      return reset
    }
    return items
  } catch { return [] }
}

function loadGathering(): Set<string> {
  try {
    const now  = Date.now()
    const cur  = lastDailyReset(now)
    const prev = parseInt(localStorage.getItem(GATHER_RESET) ?? '0')
    if (cur > prev) {
      localStorage.setItem(GATHER_RESET, String(cur))
      localStorage.removeItem(GATHER_KEY)
      return new Set()
    }
    const raw = JSON.parse(localStorage.getItem(GATHER_KEY) ?? '[]')
    return new Set(Array.isArray(raw) ? raw : [])
  } catch { return new Set() }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DailiesView() {
  const [tasks,    setTasks]   = useState<TaskItem[]>(loadTasks)
  const [taskDraft, setTaskDraft] = useState('')

  const [gathered, setGathered] = useState<Set<string>>(loadGathering)
  const [copied,   setCopied]   = useState<string | null>(null)

  const [editingWpId,  setEditingWpId]  = useState<string | null>(null)
  const [wpDraft,      setWpDraft]      = useState('')
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null)
  const wpInputRef = useRef<HTMLInputElement>(null)

  const [tasksOpen,  setTasksOpen]  = useState(true)
  const [gatherOpen, setGatherOpen] = useState(true)
  const [altOpen,    setAltOpen]    = useState(true)

  const [matIcons, setMatIcons] = useState<Map<number, string>>(new Map())
  const [hoverImg, setHoverImg] = useState<string | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })

  // ── Fetch material icons ────────────────────────────────────────────────────

  useEffect(() => {
    const allNames = new Set(GATHERING_NODES.flatMap(n => n.materials.map(m => m.name)))
    const ids = [...allNames]
      .map(name => MATERIAL_ITEM_IDS[name])
      .filter((id): id is number => id !== undefined)
    const unique = [...new Set(ids)]
    if (unique.length) fetchItemIconsBatch(unique).then(setMatIcons)
  }, [])

  // ── Auto-reset timer ────────────────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      const cur = lastDailyReset(now)

      const prevT = parseInt(localStorage.getItem(TASKS_RESET) ?? '0')
      if (cur > prevT) {
        localStorage.setItem(TASKS_RESET, String(cur))
        setTasks(prev => {
          const next = prev.map(i => ({ ...i, done: false }))
          localStorage.setItem(TASKS_KEY, JSON.stringify(next))
          return next
        })
      }

      const prevG = parseInt(localStorage.getItem(GATHER_RESET) ?? '0')
      if (cur > prevG) {
        localStorage.setItem(GATHER_RESET, String(cur))
        setGathered(new Set())
        localStorage.setItem(GATHER_KEY, JSON.stringify([]))
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => { if (editingWpId) wpInputRef.current?.focus() }, [editingWpId])

  // ── Tasks ───────────────────────────────────────────────────────────────────

  function updateTasks(next: TaskItem[]) {
    setTasks(next)
    localStorage.setItem(TASKS_KEY, JSON.stringify(next))
  }

  function addTask(e: React.FormEvent) {
    e.preventDefault()
    const text = taskDraft.trim()
    if (!text) return
    updateTasks([{ id: crypto.randomUUID(), text, done: false }, ...tasks])
    setTaskDraft('')
  }

  function toggleTask(id: string) {
    updateTasks(tasks.map(i => i.id === id ? { ...i, done: !i.done } : i))
  }

  function removeTask(id: string) { updateTasks(tasks.filter(i => i.id !== id)) }

  function startTaskWp(item: TaskItem)  { setEditingWpId(item.id); setWpDraft(item.waypoint ?? '') }
  function cancelTaskWp()               { setEditingWpId(null); setWpDraft('') }
  function saveTaskWp(id: string) {
    const code = wpDraft.trim()
    updateTasks(tasks.map(i => i.id === id ? { ...i, waypoint: code || undefined } : i))
    setEditingWpId(null); setWpDraft('')
  }

  async function copyTaskWp(itemId: string, code: string) {
    await navigator.clipboard.writeText(`/me ${code}`)
    setCopiedTaskId(itemId)
    setTimeout(() => setCopiedTaskId(null), 1500)
  }

  // ── Gathering ───────────────────────────────────────────────────────────────

  async function copyWp(waypoint: string) {
    await navigator.clipboard.writeText(`/me ${waypoint}`)
    setCopied(waypoint)
    setTimeout(() => setCopied(null), 1500)
  }

  function toggleGather(key: string, waypoint?: string) {
    const next = new Set(gathered)
    if (next.has(key)) next.delete(key)
    else { next.add(key); if (waypoint) copyWp(waypoint) }
    setGathered(next)
    localStorage.setItem(GATHER_KEY, JSON.stringify([...next]))
  }

  function resetGathering() {
    setGathered(new Set())
    localStorage.setItem(GATHER_KEY, JSON.stringify([]))
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function renderTaskWp(item: TaskItem) {
    if (editingWpId === item.id) return (
      <div className="wp-editor">
        <input ref={wpInputRef} className="wp-input" value={wpDraft}
          onChange={e => setWpDraft(e.target.value)} placeholder="[&BIOCAAA=]"
          onKeyDown={e => {
            if (e.key === 'Enter')  { e.preventDefault(); saveTaskWp(item.id) }
            if (e.key === 'Escape') cancelTaskWp()
          }} />
        <button className="wp-action confirm" onClick={() => saveTaskWp(item.id)}>✓</button>
        <button className="wp-action cancel"  onClick={cancelTaskWp}>✕</button>
      </div>
    )
    if (item.waypoint) return (
      <div className="wp-badge">
        <button className="wp-code" onClick={() => startTaskWp(item)}>{item.waypoint}</button>
        <button className={`wp-copy${copiedTaskId === item.id ? ' copied' : ''}`}
          onClick={() => copyTaskWp(item.id, item.waypoint!)}
          title={`Copy: /me ${item.waypoint}`}>
          {copiedTaskId === item.id ? '✓' : '⎘'}
        </button>
      </div>
    )
    return <button className="wp-add" onClick={() => startTaskWp(item)}>+ WP</button>
  }

  function renderNote(note: string) {
    const match = note.match(/^(.*?)(https?:\/\/\S+)(.*)$/)
    if (match) return <>{match[1]}<a href={match[2]} target="_blank" rel="noreferrer">{match[2]}</a>{match[3]}</>
    return note
  }

  const activeTasks  = tasks.filter(i => !i.done)
  const doneTasks    = tasks.filter(i =>  i.done)
  const gatherTotal  = GATHERING_NODES.length
  const gatherDone   = gathered.size

  return (
    <div className="task-list-view">

      {/* ── Hover image portal ───────────────────────────────────────────────── */}
      {hoverImg && createPortal(
        <div className="gathering-hover-portal" style={{
          top:  Math.min(hoverPos.y - 10, window.innerHeight - 410),
          left: Math.min(hoverPos.x + 20, window.innerWidth  - 410),
        }}>
          <img src={hoverImg} alt="preview"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <p className="gathering-hover-caption">
            {(() => { try { return new URL(hoverImg).hostname.replace(/^www\./, '') } catch { return hoverImg } })()}
          </p>
        </div>,
        document.body
      )}

      {/* ── Daily Tasks ──────────────────────────────────────────────────────── */}
      <div className="todo-header" style={{ cursor: 'pointer' }} onClick={() => setTasksOpen(o => !o)}>
        <span className={`section-chevron${tasksOpen ? ' open' : ''}`}>›</span>
        <h2>Dailies</h2>
        <span className="todo-count">{activeTasks.length} remaining</span>
      </div>

      {tasksOpen && <>
        {/* Compiled daily reference cards */}
        <div className="daily-info-cards">
          {DAILY_SECTIONS.map(section => (
            <div key={section.name} className="daily-info-card">
              <div className="daily-info-card-header">
                <span className="daily-info-card-name">{section.name}</span>
                {section.totalAcclaim != null && (
                  <span className="daily-acclaim">{section.totalAcclaim} Acclaim</span>
                )}
              </div>
              {section.description && <p className="daily-info-card-desc">{section.description}</p>}
              {section.tiers && (
                <div className="daily-tiers">
                  {section.tiers.map(tier => (
                    <a key={tier.name} href={tier.url} target="_blank" rel="noreferrer"
                      className="daily-tier-link">
                      {tier.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Custom task list */}
        <p className="custom-tasks-label">Custom Tasks</p>
        <form className="todo-form" onSubmit={addTask}>
          <input className="todo-input" value={taskDraft}
            onChange={e => setTaskDraft(e.target.value)} placeholder="Add a daily task…" />
          <button className="btn-primary" type="submit" disabled={!taskDraft.trim()}>Add</button>
        </form>

        {activeTasks.length === 0 && doneTasks.length === 0 && (
          <p className="todo-empty" style={{ padding: '16px 0' }}>No custom tasks yet.</p>
        )}

        {activeTasks.length > 0 && (
          <ul className="todo-list">
            {activeTasks.map(item => (
              <li key={item.id} className="todo-item">
                <button className="todo-check" onClick={() => toggleTask(item.id)}>
                  <span className="todo-check-box" />
                </button>
                <span className="todo-text">{item.text}</span>
                {renderTaskWp(item)}
                <button className="todo-delete" onClick={() => removeTask(item.id)} aria-label="Delete">✕</button>
              </li>
            ))}
          </ul>
        )}

        {doneTasks.length > 0 && (
          <div className="todo-done-section">
            <div className="todo-done-header"><span>Done ({doneTasks.length})</span></div>
            <ul className="todo-list done">
              {doneTasks.map(item => (
                <li key={item.id} className="todo-item done">
                  <button className="todo-check" onClick={() => toggleTask(item.id)}>
                    <span className="todo-check-box checked">✓</span>
                  </button>
                  <span className="todo-text">{item.text}</span>
                  {renderTaskWp(item)}
                  <button className="todo-delete" onClick={() => removeTask(item.id)} aria-label="Delete">✕</button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </>}

      {/* ── Gathering ────────────────────────────────────────────────────────── */}
      <div className="daily-section-heading" style={{ cursor: 'pointer' }} onClick={() => setGatherOpen(o => !o)}>
        <span className={`section-chevron${gatherOpen ? ' open' : ''}`}>›</span>
        <span>Gathering</span>
        {gatherDone > 0 && <span className="daily-section-count">{gatherDone} / {gatherTotal}</span>}
        <div className="daily-section-line" />
        {gatherDone > 0 && (
          <button className="btn-icon-reset" title="Reset gathering"
            onClick={e => { e.stopPropagation(); resetGathering() }}>↺</button>
        )}
      </div>

      {gatherOpen && (
        <ul className="todo-list">
          {GATHERING_NODES.map(node => {
            const key    = nodeKey(node)
            const isDone = gathered.has(key)
            const vm     = estimateVM(node)
            return (
              <li key={key}
                className={`todo-item with-detail${isDone ? ' done' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => toggleGather(key, node.waypoint)}
                onMouseEnter={e => { if (node.image) { setHoverImg(node.image); setHoverPos({ x: e.clientX, y: e.clientY }) } }}
                onMouseMove={e => { if (node.image) setHoverPos({ x: e.clientX, y: e.clientY }) }}
                onMouseLeave={() => setHoverImg(null)}
              >
                <button className="todo-check"
                  onClick={e => { e.stopPropagation(); toggleGather(key, node.waypoint) }}>
                  <span className={`todo-check-box${isDone ? ' checked' : ''}`}>
                    {isDone ? '✓' : ''}
                  </span>
                </button>

                <div className="gathering-node-info">
                  <span className="todo-text">{node.location}</span>
                  {node.zone !== node.location && (
                    <span className="gathering-node-zone">{node.zone}</span>
                  )}
                  {node.materials.length > 0 && (
                    <div className="gathering-materials">
                      {node.materials.map(mat => {
                        const id   = MATERIAL_ITEM_IDS[mat.name]
                        const icon = id !== undefined ? matIcons.get(id) : undefined
                        return (
                          <span key={mat.name} className="gathering-mat-chip"
                            title={`${mat.name} ×${mat.count}`}>
                            {icon
                              ? <img src={icon} className="gathering-mat-icon" alt={mat.name} />
                              : <span className="gathering-mat-abbr">{mat.name.slice(0, 3)}</span>
                            }
                            <span className="gathering-mat-count">×{mat.count}</span>
                          </span>
                        )
                      })}
                      {vm.avg > 0 && (
                        <span className="gathering-vm" title={`${vm.min}–${vm.max} VM`}>
                          ~{vm.avg} VM
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {node.waypoint && (
                  <div className="wp-badge" onClick={e => e.stopPropagation()}>
                    <span className="wp-code">{node.waypoint}</span>
                    <button className={`wp-copy${copied === node.waypoint ? ' copied' : ''}`}
                      onClick={e => { e.stopPropagation(); copyWp(node.waypoint!) }}
                      title={`Copy: /me ${node.waypoint}`}>
                      {copied === node.waypoint ? '✓' : '⎘'}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* ── Alt Parking ──────────────────────────────────────────────────────── */}
      <div className="daily-section-heading" style={{ cursor: 'pointer' }} onClick={() => setAltOpen(o => !o)}>
        <span className={`section-chevron${altOpen ? ' open' : ''}`}>›</span>
        <span>Alt Parking</span>
        <div className="daily-section-line" />
      </div>

      {altOpen && (
        <div>
          {PARKING_GROUPS.map(group => (
            <div key={group.name} className="parking-group">
              <p className="parking-group-name">{group.name}</p>
              {group.notes && (
                <div className="parking-group-notes">
                  {group.notes.map(note => (
                    <p key={note} className="parking-group-note">{renderNote(note)}</p>
                  ))}
                </div>
              )}
              <ul className="todo-list">
                {group.spots.map(spot => (
                  <li key={spot.name} className="todo-item"
                    onMouseEnter={e => { if (spot.image) { setHoverImg(spot.image); setHoverPos({ x: e.clientX, y: e.clientY }) } }}
                    onMouseMove={e => { if (spot.image) setHoverPos({ x: e.clientX, y: e.clientY }) }}
                    onMouseLeave={() => setHoverImg(null)}
                  >
                    <div className="vendor-info">
                      <span className="todo-text">
                        {spot.url
                          ? <a href={spot.url} target="_blank" rel="noreferrer"
                              onClick={e => e.stopPropagation()}>{spot.name}</a>
                          : spot.name
                        }
                      </span>
                    </div>
                    <span className="parking-rewards">{spot.rewards.join(' · ')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
