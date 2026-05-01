import type { Category } from '../types'

interface Props {
  active: Category
  onChange: (c: Category) => void
}

export function CategorySelector({ active, onChange }: Props) {
  return (
    <nav className="category-nav">
      {(['armor', 'weapon'] as Category[]).map(cat => (
        <button
          key={cat}
          className={`category-tab${active === cat ? ' active' : ''}`}
          onClick={() => onChange(cat)}
        >
          {cat === 'armor' ? 'Armors' : 'Weapons'}
        </button>
      ))}
    </nav>
  )
}
