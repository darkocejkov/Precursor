import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const CACHE_DIR  = path.join(__dirname, '../.cache')

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })

function cacheKey(url: string) {
  return createHash('md5').update(url).digest('hex')
}

export async function fetchWithCache<T = unknown>(url: string, bustCache = false): Promise<T> {
  const key       = cacheKey(url)
  const cachePath = path.join(CACHE_DIR, `${key}.json`)

  if (!bustCache && fs.existsSync(cachePath)) {
    return JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as T
  }

  process.stdout.write(`  [GET] ${url}\n`)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Precursor/1.0 (compiler script)' },
  })

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`)
  }

  const data = await res.json() as T
  fs.writeFileSync(cachePath, JSON.stringify(data))
  return data
}

export function clearCache() {
  for (const f of fs.readdirSync(CACHE_DIR)) {
    fs.unlinkSync(path.join(CACHE_DIR, f))
  }
  console.log('Cache cleared.')
}
