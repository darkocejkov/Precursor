import { useState } from 'react'
import type { MaterialNode, PlayerInventory } from '../types'

interface Props {
  node: MaterialNode
  inventory: PlayerInventory | null
  depth?: number
  collapsed?: boolean
  onToggle?: () => void
}

export function MaterialRow({ node, inventory, depth = 0, collapsed, onToggle }: Props) {
  const [selfOpen, setSelfOpen] = useState(true)

  const isTrackable = node.itemId !== undefined && node.quantity !== undefined
  const hasChildren = (node.children?.length ?? 0) > 0

  const have = isTrackable ? (inventory?.counts.get(node.itemId!) ?? 0) : null
  const need = isTrackable ? node.quantity! : null
  const ratio = have !== null && need !== null ? Math.min(have / need, 1) : null
  const done = ratio === 1

  // depth-0: externally controlled; depth-1: self-managed
  const isOpen = depth === 0 ? !collapsed : selfOpen
  const canToggle = hasChildren && depth <= 2

  function handleToggle() {
    if (depth === 0) onToggle?.()
    else setSelfOpen(o => !o)
  }

  return (
    <li className={`mat-row depth-${depth}${done ? ' done' : ''}${!isOpen ? ' is-collapsed' : ''}`}>
      <div
        className={`mat-row-header${canToggle ? ' can-toggle' : ''}`}
        onClick={canToggle ? handleToggle : undefined}
      >
        {canToggle && (
          <span className={`mat-chevron${isOpen ? ' open' : ''}`}>›</span>
        )}

        <span className="mat-name">
          {node.name}
          {node.source && <span className="mat-source"> ({node.source})</span>}
        </span>

        {isTrackable && inventory && (
          <span className={`mat-count${done ? ' done' : have! > 0 ? ' partial' : ' none'}`}>
            {have?.toLocaleString()} / {need?.toLocaleString()}
          </span>
        )}

        {isTrackable && !inventory && node.quantity !== undefined && (
          <span className="mat-count need-only">needs {node.quantity.toLocaleString()}</span>
        )}

        {!isTrackable && node.quantity !== undefined && (
          <span className="mat-count need-only">×{node.quantity}</span>
        )}
      </div>

      {isOpen && (
        <>
          {isTrackable && inventory && ratio !== null && (
            <div className="progress-bar-track">
              <div
                className={`progress-bar-fill${done ? ' done' : ''}`}
                style={{ width: `${ratio * 100}%` }}
              />
            </div>
          )}

          {node.note && <p className="mat-note">{node.note}</p>}

          {hasChildren && (
            <ul className="mat-children">
              {node.children!.map((child, i) => (
                <MaterialRow key={i} node={child} inventory={inventory} depth={depth + 1} />
              ))}
            </ul>
          )}
        </>
      )}
    </li>
  )
}
