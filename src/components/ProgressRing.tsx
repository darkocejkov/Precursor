import type { MaterialNode, PlayerInventory } from '../types'

// ── Progress calculation ──────────────────────────────────────────────────────
// Walks the material tree counting only leaf-level trackable nodes (itemId + no
// children that also have itemIds) to avoid double-counting intermediate crafted items.

export function computeItemProgress(
  components: MaterialNode[],
  inventory: PlayerInventory
): number {
  let totalNeed = 0
  let totalHave = 0

  function visit(node: MaterialNode) {
    const trackableChildCount = node.children?.filter(c => c.itemId !== undefined).length ?? 0

    if (node.itemId !== undefined && node.quantity !== undefined) {
      if (trackableChildCount === 0) {
        // Leaf trackable node — count it directly
        totalNeed += node.quantity
        totalHave += Math.min(node.quantity, inventory.counts.get(node.itemId) ?? 0)
        return
      }
      // Has sub-craftable children — check if parent is already satisfied in bank.
      // If so, don't double-count the children.
      const have = inventory.counts.get(node.itemId) ?? 0
      if (have >= node.quantity) {
        totalNeed += node.quantity
        totalHave += node.quantity
        return
      }
    }

    node.children?.forEach(visit)
  }

  components.forEach(visit)
  return totalNeed > 0 ? totalHave / totalNeed : 0
}

// ── SVG ring component ────────────────────────────────────────────────────────

interface Props {
  pct: number    // 0–1
  size?: number  // px
  owned: boolean
}

export function ProgressRing({ pct, size = 22, owned }: Props) {
  if (owned) {
    return (
      <span
        className="item-owned-badge"
        title="In Legendary Armory"
        aria-label="Owned"
      >
        ◆
      </span>
    )
  }

  const stroke    = 2.5
  const r         = (size - stroke) / 2
  const circ      = 2 * Math.PI * r
  const dash      = pct * circ
  const cx        = size / 2
  const isEmpty   = pct === 0
  const isComplete = pct >= 0.9999

  return (
    <svg
      width={size}
      height={size}
      className="progress-ring"
      aria-label={`${Math.round(pct * 100)}% complete`}
      style={{ flexShrink: 0 }}
    >
      {/* track */}
      <circle
        cx={cx} cy={cx} r={r}
        fill="none"
        stroke="var(--border)"
        strokeWidth={stroke}
      />
      {/* fill */}
      {!isEmpty && (
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={isComplete ? 'var(--green)' : 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            transition: 'stroke-dasharray 0.4s ease',
          }}
        />
      )}
    </svg>
  )
}
