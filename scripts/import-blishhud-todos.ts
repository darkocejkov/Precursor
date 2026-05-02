#!/usr/bin/env tsx
/**
 * Converts BlishHUD .todo.json files into Precursor's todo JSON format.
 *
 * Usage:
 *   npx tsx scripts/import-blishhud-todos.ts [todos-dir] [output-file]
 *
 * Defaults:
 *   todos-dir   : C:\Users\<you>\OneDrive\Documents\Guild Wars 2\addons\blishhud\todos
 *   output-file : precursor-todos-import.json  (in project root, ready to Import in the app)
 */

import fs   from 'node:fs'
import path from 'node:path'
import os   from 'node:os'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── BlishHUD schema ───────────────────────────────────────────────────────────

interface BlishTodo {
  Version: number
  CreatedAt: string
  Schedule: {
    Type: number       // 0 = recurring, 1 = one-time
    LocalTime: string
    Duration: string   // .NET TimeSpan: "D.HH:MM:SS"
    Executions: string[]
  }
  OrderIndex: number
  Description: string
  ClipboardContent: string | null
}

// ── Precursor schema ───────────────────────────────────────────────────────

type ResetCycle = 'daily' | 'weekly'

interface TodoItem {
  id: string
  text: string
  done: boolean
  resetOn?: ResetCycle
  waypoint?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDurationDays(duration: string): number {
  // .NET TimeSpan format: "D.HH:MM:SS" or "HH:MM:SS"
  const match = duration.match(/^(?:(\d+)\.)?(\d+):(\d+):(\d+)$/)
  if (!match) return 1
  const days = parseInt(match[1] ?? '0')
  return days
}

function toResetCycle(blish: BlishTodo): ResetCycle | undefined {
  // Type 0: repeating every Duration
  // Type 1: runs daily at a specific LocalTime
  const days = parseDurationDays(blish.Schedule.Duration)
  if (days >= 7) return 'weekly'
  return 'daily'   // 1-day, daily-scheduled, or unknown → daily
}

function extractWaypoint(clip: string | null): string | undefined {
  if (!clip) return undefined
  const match = clip.match(/(\[&[A-Za-z0-9+/]+=*\])/)
  return match?.[1]
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  const defaultDir = path.join(
    os.homedir(),
    'OneDrive', 'Documents', 'Guild Wars 2', 'addons', 'blishhud', 'todos'
  )

  const todosDir  = process.argv[2] ?? defaultDir
  const outFile   = process.argv[3] ?? path.join(__dirname, '..', 'precursor-todos-import.json')

  if (!fs.existsSync(todosDir)) {
    console.error(`Directory not found: ${todosDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(todosDir).filter(f => f.endsWith('.json'))
  if (!files.length) {
    console.error('No .json files found in', todosDir)
    process.exit(1)
  }

  const parsed: (BlishTodo & { _file: string })[] = []

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(todosDir, file), 'utf-8')
      const d = JSON.parse(raw) as BlishTodo
      parsed.push({ ...d, _file: file })
    } catch (e) {
      console.warn(`  skip ${file}: ${e}`)
    }
  }

  // Sort by OrderIndex ascending (BlishHUD display order)
  parsed.sort((a, b) => (a.OrderIndex < b.OrderIndex ? -1 : a.OrderIndex > b.OrderIndex ? 1 : 0))

  const output: TodoItem[] = parsed.map(d => {
    const item: TodoItem = {
      id:   randomUUID(),
      text: d.Description,
      done: false,
    }
    const reset = toResetCycle(d)
    if (reset) item.resetOn = reset
    const wp = extractWaypoint(d.ClipboardContent)
    if (wp) item.waypoint = wp
    return item
  })

  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf-8')

  const daily  = output.filter(i => i.resetOn === 'daily').length
  const weekly = output.filter(i => i.resetOn === 'weekly').length
  const oneoff = output.filter(i => !i.resetOn).length
  const wps    = output.filter(i => i.waypoint).length

  console.log(`✓ Converted ${output.length} todos → ${path.relative(process.cwd(), outFile)}`)
  console.log(`  daily: ${daily}  weekly: ${weekly}  one-off: ${oneoff}  with waypoint: ${wps}`)
  console.log()
  console.log('Import into Precursor: To-Do tab → Import button → select the file above.')
}

main()
