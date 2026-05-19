import type { Category } from '../types'

interface Props {
  active: Category
  onChange: (c: Category) => void
}

const LABELS: Record<Category, string> = {
  armor:     'Armors',
  weapon:    'Weapons',
  accessory: 'Accessories',
}

export function CategorySelector({ active, onChange }: Props) {
  return (
    <nav className="category-nav">
      {(['armor', 'weapon', 'accessory'] as Category[]).map(cat => (
        <button
          key={cat}
          className={`category-tab${active === cat ? ' active' : ''}`}
          onClick={() => onChange(cat)}
        >
          {LABELS[cat]}
        </button>
      ))}
    </nav>
  )
}
