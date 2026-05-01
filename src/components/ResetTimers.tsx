import { useState, useEffect } from 'react'

// ── Next-reset helpers ────────────────────────────────────────────────────────

function nextDaily(now: number): number {
  const d = new Date(now)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)
}

function nextWeekly(now: number): number {
  // Every Monday 07:30 UTC
  const d = new Date(now)
  const day = d.getUTCDay() // 0 Sun … 6 Sat
  let daysAhead = (1 - day + 7) % 7   // days until Monday
  const candidate = Date.UTC(
    d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + daysAhead, 7, 30
  )
  // If that reset has already passed today (or right now), push to next week
  return candidate > now ? candidate : candidate + 7 * 86400_000
}

// Known Wizard's Vault season resets (UTC midnight). Extend this list as seasons release.
const VAULT_RESETS = [
  Date.UTC(2026, 4, 12),  // May 12 2026
]

function nextVault(now: number): number {
  for (const t of VAULT_RESETS) {
    if (t > now) return t
  }
  // Auto-project 90-day cycles from the last known reset
  let t = VAULT_RESETS[VAULT_RESETS.length - 1]
  while (t <= now) t += 90 * 86400_000
  return t
}

// ── Formatting ────────────────────────────────────────────────────────────────

function fmt(ms: number): string {
  if (ms <= 0) return '—'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60

  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${String(sec).padStart(2, '0')}s`
  return `${m}m ${String(sec).padStart(2, '0')}s`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Chip {
  label: string
  target: number
  variant?: 'default' | 'special'
}

function ResetChip({ label, target, variant = 'default', now }: Chip & { now: number }) {
  const remaining = target - now
  const urgent = remaining < 3600_000  // < 1 hour
  return (
    <div className={`reset-chip${variant === 'special' ? ' special' : ''}${urgent ? ' urgent' : ''}`}>
      <span className="reset-label">{label}</span>
      <span className="reset-countdown">{fmt(remaining)}</span>
    </div>
  )
}

export function ResetTimers() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="reset-timers">
      <ResetChip label="Daily"  target={nextDaily(now)}  now={now} />
      <ResetChip label="Weekly" target={nextWeekly(now)} now={now} />
      <ResetChip label="Season" target={nextVault(now)}  now={now} variant="special" />
    </div>
  )
}
