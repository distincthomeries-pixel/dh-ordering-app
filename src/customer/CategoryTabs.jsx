export default function CategoryTabs({ categories, activeId, onSelect }) {
  if (!categories.length) return null;

  return (
    <div className="sticky top-[57px] z-20 bg-cream/95 dark:bg-night/95 backdrop-blur-md border-b border-cream-line dark:border-night-line -mx-4 px-4">
      {/* Changed to a seamless tab bar */}
      <div className="flex overflow-x-auto hide-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`whitespace-nowrap px-5 py-3.5 text-sm font-bold transition-all border-b-2 ${
              activeId === cat.id
                ? 'border-brand-600 text-brand-600 dark:border-brand-500 dark:text-brand-400'
                : 'border-transparent text-ink-muted hover:text-ink dark:text-cream/60 dark:hover:text-cream'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}