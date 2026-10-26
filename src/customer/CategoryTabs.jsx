export default function CategoryTabs({ categories, activeId, onSelect }) {
  if (!categories.length) return null;

  return (
    <div className="sticky top-[57px] z-20 bg-cream/95 dark:bg-night/95 backdrop-blur-md border-b border-cream-line dark:border-night-line pt-2 pb-2 -mx-4 px-4">
      <div className="flex overflow-x-auto hide-scrollbar space-x-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
              activeId === cat.id
                ? 'bg-brand-600 text-white shadow-md'
                : 'bg-cream-soft text-ink-muted hover:bg-brand-50 dark:bg-night-surface dark:text-cream/70 dark:hover:bg-night-line'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}