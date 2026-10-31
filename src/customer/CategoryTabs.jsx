export default function CategoryTabs({ categories, activeId, onSelect }) {
  if (!categories.length) return null;

  return (
    <div className="sticky top-[57px] z-20 bg-cream/95 dark:bg-night/95 backdrop-blur-md border-b border-cream-line dark:border-night-line pt-2 pb-2 -mx-4 px-4">
      {/* Changed space-x-2 to space-x-1.5 and added flex-wrap just in case */}
      <div className="flex overflow-x-auto hide-scrollbar space-x-1.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            // Reduced padding from px-5 to px-3.5, and text-sm to text-[13px]
            className={`whitespace-nowrap px-3.5 py-2 rounded-full text-[13px] font-semibold transition-colors ${
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