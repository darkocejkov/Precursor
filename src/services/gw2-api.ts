import type { GW2BankSlot, GW2MaterialSlot, PlayerInventory } from '../types'

const BASE = 'https://api.guildwars2.com'

async function apiFetch<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${BASE}${path}?access_token=${apiKey}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { text?: string }).text ?? `GW2 API error ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function validateApiKey(apiKey: string): Promise<string> {
  const data = await apiFetch<{ name: string }>('/v2/account', apiKey)
  return data.name
}

export async function fetchLegendaryArmory(apiKey: string): Promise<Set<number>> {
  const slots = await apiFetch<{ id: number; count: number }[]>('/v2/account/legendaryarmory', apiKey)
  return new Set(slots.map(s => s.id))
}

export async function fetchInventory(apiKey: string): Promise<PlayerInventory> {
  const [bank, materials] = await Promise.all([
    apiFetch<(GW2BankSlot | null)[]>('/v2/account/bank', apiKey),
    apiFetch<GW2MaterialSlot[]>('/v2/account/materials', apiKey),
  ])

  const counts = new Map<number, number>()

  for (const slot of bank) {
    if (!slot) continue
    counts.set(slot.id, (counts.get(slot.id) ?? 0) + slot.count)
  }

  for (const slot of materials) {
    if (!slot.count) continue
    counts.set(slot.id, (counts.get(slot.id) ?? 0) + slot.count)
  }

  return { counts }
}
