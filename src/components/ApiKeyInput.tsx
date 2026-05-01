import { useState } from 'react'
import { validateApiKey } from '../services/gw2-api'

interface Props {
  apiKey: string
  accountName: string | null
  onSave: (key: string, accountName: string) => void
  onClear: () => void
}

export function ApiKeyInput({ apiKey, accountName, onSave, onClear }: Props) {
  const [draft, setDraft] = useState(apiKey)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const name = await validateApiKey(draft.trim())
      onSave(draft.trim(), name)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid API key')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="api-key-section">
      <h2>GW2 API Key</h2>
      {accountName && (
        <div className="account-badge">
          <span className="account-name">{accountName}</span>
          <button className="btn-ghost" onClick={onClear}>Change</button>
        </div>
      )}
      {!accountName && (
        <form onSubmit={handleSubmit} className="api-key-form">
          <input
            type="password"
            className="api-key-input"
            placeholder="Paste your API key here…"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <button className="btn-primary" type="submit" disabled={loading || !draft.trim()}>
            {loading ? 'Checking…' : 'Connect'}
          </button>
        </form>
      )}
      {error && <p className="error-text">{error}</p>}
      <p className="api-key-hint">
        Needs <strong>inventories</strong> permission. Create one at{' '}
        <a href="https://account.arena.net/applications" target="_blank" rel="noreferrer">
          account.arena.net/applications
        </a>
      </p>
    </section>
  )
}
