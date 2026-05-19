import { useState, useEffect } from 'react'
import { GATHERING_NODES } from '../data/gathering'

const STORAGE_KEY    = 'precursor_gathering_done'
const LAST_RESET_KEY = 'precursor_gathering_last_reset'

function lastDailyReset(now: number): number {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function loadDone(): Set<string> {
  try {
    const now  = Date.now()
    const cur  = lastDailyReset(now)
    const prev = parseInt(localStorage.getItem(LAST_RESET_KEY) ?? '0')
    if (cur > prev) {
      localStorage.setItem(LAST_RESET_KEY, String(cur))
      localStorage.removeItem(STORAGE_KEY)
      return new Set()
    }
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(raw) ? raw : [])
  } catch {
    return new Set()
  }
}

function saveDone(set: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]))
}

export function GatheringList() {
  const [done,   setDone]   = useState<Set<string>>(loadDone)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      const now  = Date.now()
      const cur  = lastDailyReset(now)
      const prev = parseInt(localStorage.getItem(LAST_RESET_KEY) ?? '0')
      if (cur > prev) {
        localStorage.setItem(LAST_RESET_KEY, String(cur))
        const empty = new Set<string>()
        setDone(empty)
        saveDone(empty)
      }
    }, 30_000)
    return () => clearInterval(id)
  }, [])

  function toggle(waypoint: string) {
    const next = new Set(done)
    if (next.has(waypoint)) next.delete(waypoint)
    else next.add(waypoint)
    setDone(next)
    saveDone(next)
    copyWp(waypoint)
  }

  function resetAll() {
    const empty = new Set<string>()
    setDone(empty)
    saveDone(empty)
  }

  async function copyWp(waypoint: string) {
    await navigator.clipboard.writeText(`/me ${waypoint}`)
    setCopied(waypoint)
    setTimeout(() => setCopied(null), 1500)
  }

  const total     = GATHERING_NODES.length
  const doneCount = done.size

  return (
    <div className="gathering-view">
      <div className="todo-header">
        <h2>Gathering</h2>
        <span className="todo-count">{doneCount} / {total} collected</span>
        <div className="todo-header-spacer" />
        {doneCount > 0 && (
          <button className="btn-ghost" onClick={resetAll}>Reset all</button>
        )}
      </div>

      <ul className="todo-list">
        {GATHERING_NODES.map(node => {
          const isDone = done.has(node.waypoint)
          const label  = node.location.replace(' Waypoint', '')
          return (
            <li
              key={node.waypoint}
              className={`todo-item${isDone ? ' done' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => toggle(node.waypoint)}
            >
              <button
                className="todo-check"
                onClick={e => { e.stopPropagation(); toggle(node.waypoint) }}
                aria-label="Toggle collected"
              >
                <span className={`todo-check-box${isDone ? ' checked' : ''}`}>
                  {isDone ? '✓' : ''}
                </span>
              </button>

              <div className="gathering-node-info">
                <span className="todo-text">{label}</span>
                <span className="gathering-node-zone">{node.zone}</span>
              </div>

              <div className="wp-badge">
                <span className="wp-code">{node.waypoint}</span>
                <button
                  className={`wp-copy${copied === node.waypoint ? ' copied' : ''}`}
                  onClick={e => { e.stopPropagation(); copyWp(node.waypoint) }}
                  title={`Copy: /me ${node.waypoint}`}
                >
                  {copied === node.waypoint ? '✓' : '⎘'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
