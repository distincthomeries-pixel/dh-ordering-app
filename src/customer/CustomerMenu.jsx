import { useState, useMemo, useEffect } from 'react';
import { useMenuData } from '../hooks/useMenuData.js';
import CategoryTabs from './CategoryTabs.jsx';
import ItemCard from './ItemCard.jsx';

export default function CustomerMenu({ onOpenItem }) {
  const { categories = [], items = [], sizes = [], options = [], loading, error } = useMenuData();
  
  const [search, setSearch] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [activeSubsection, setActiveSubsection] = useState('');

  // Set default category when loaded
  useEffect(() => {
    if (categories.length > 0 && !activeCategoryId) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  // Get items for the active category
  const categoryItems = useMemo(() => {
    return items.filter(i => i.category_id === activeCategoryId);
  }, [items, activeCategoryId]);

  // Find unique subsections AND enforce the exact order you want
  const subsections = useMemo(() => {
    const subs = categoryItems.map(i => i.subsection).filter(Boolean);
    const uniqueSubs = [...new Set(subs)];

    // Force this specific order:
    const preferredOrder = [
      'Rice Packages', 'Swallow Packages', 'Porridge Packages',
      'Rice', 'Swallow', 'Others', 'Proteins'
    ];

    return uniqueSubs.sort((a, b) => {
      const indexA = preferredOrder.indexOf(a);
      const indexB = preferredOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [categoryItems]);

  // Automatically select the first subsection when category changes
  useEffect(() => {
    if (subsections.length > 0) {
      if (!subsections.includes(activeSubsection)) {
        setActiveSubsection(subsections[0]);
      }
    } else {
      setActiveSubsection('');
    }
  }, [subsections, activeSubsection]);

  const handleCategoryChange = (catId) => {
    setActiveCategoryId(catId);
    setActiveSubsection(''); 
    setSearch('');
  };

  // Filter items based on Subsection AND Search
  const displayedItems = useMemo(() => {
    let result = categoryItems;

    if (search.trim()) {
      const lower = search.toLowerCase();
      return result.filter(
        i => i.name.toLowerCase().includes(lower) || (i.description && i.description.toLowerCase().includes(lower))
      );
    }

    if (activeSubsection) {
      result = result.filter(i => i.subsection === activeSubsection);
    }
    return result;
  }, [categoryItems, activeSubsection, search]);

  if (loading) return <div className="p-8 text-center text-ink-muted animate-pulse">Loading menu...</div>;
  if (error) return <div className="p-4 text-brand-600">Error loading menu: {error}</div>;

  return (
    <div className="pb-32">
      {/* Search Bar */}
      <div className="pt-4 pb-2">
        <input
          type="search"
          placeholder="Search for food, drinks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white dark:bg-night-surface border border-cream-line dark:border-night-line rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none placeholder:text-ink-muted shadow-sm"
        />
      </div>

      {/* Main Category Tabs (Pages) */}
      <CategoryTabs 
        categories={categories} 
        activeId={activeCategoryId} 
        onSelect={handleCategoryChange} 
      />

      {/* Sub-category Tabs */}
      {!search && subsections.length > 0 && (
        <div className="flex overflow-x-auto hide-scrollbar space-x-2 py-4">
          {subsections.map(sub => (
            <button
              key={sub}
              onClick={() => setActiveSubsection(sub)}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${
                activeSubsection === sub
                  ? 'bg-brand-50 text-brand-700 border-brand-600 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-500'
                  : 'bg-transparent text-ink-muted border-cream-line hover:bg-cream-soft dark:text-cream/60 dark:border-night-line dark:hover:bg-night-line'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Menu Items Area */}
      <div className="mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayedItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              sizes={sizes.filter(s => s.item_id === item.id)}
              options={options.filter(o => o.item_id === item.id)}
              onOpen={onOpenItem}
            />
          ))}
        </div>
        
        {displayedItems.length === 0 && (
          <div className="text-center py-12 text-ink-muted">
            No items found.
          </div>
        )}
      </div>
    </div>
  );
}