import { useState } from 'react'
import type { LegendaryItem, PlayerInventory } from '../types'
import { MaterialRow } from './MaterialRow'

interface Props {
  item: LegendaryItem
  inventory: PlayerInventory | null
}

export function LegendaryDetail({ item, inventory }: Props) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  function expandAll()   { setCollapsed(new Set()) }
  function collapseAll() { setCollapsed(new Set(item.components.map((_, i) => i))) }
  function toggle(i: number) {
    setCollapsed(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="legendary-detail">
      <div className="legendary-detail-header">
        <div className="legendary-detail-title">
          <h2>{item.name}</h2>
          <span className="subtype-badge">{item.subtype}</span>
        </div>
        <div className="mat-toolbar">
          <button className="mat-toolbar-btn" onClick={expandAll}>Expand All</button>
          <button className="mat-toolbar-btn" onClick={collapseAll}>Collapse All</button>
        </div>
      </div>

      {!inventory && (
        <p className="info-text">Connect your API key to see your current counts.</p>
      )}

      <ul className="mat-tree">
        {item.components.map((node, i) => (
          <MaterialRow
            key={i}
            node={node}
            inventory={inventory}
            depth={0}
            collapsed={collapsed.has(i)}
            onToggle={() => toggle(i)}
          />
        ))}
      </ul>
    </div>
  )
}
