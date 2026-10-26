import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import ThemeToggle from '../components/ThemeToggle.jsx';
import CustomerMenu from './CustomerMenu.jsx';
import ItemPanel from './ItemPanel.jsx';
import CartBar from './CartBar.jsx';
import Banner from './Banner.jsx';

export default function CustomerApp() {
  const [settings, setSettings] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    supabase.from('settings').select('*').eq('id', 1).single()
      .then(({ data }) => setSettings(data));
  }, []);

  return (
    <div className="min-h-dvh bg-cream dark:bg-night">
      <header className="sticky top-0 z-30 border-b border-cream-line dark:border-night-line bg-cream/90 dark:bg-night/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="font-display text-lg font-bold leading-tight line-clamp-1">
              {settings?.restaurant_name || 'Loading...'}
            </h1>
            {settings && (
              <p className={`text-[11px] font-bold uppercase tracking-wider ${settings.is_open ? 'text-green-600 dark:text-green-400' : 'text-brand-600'}`}>
                {settings.is_open ? '• Open Now' : '• Closed'}
              </p>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* The new Banner component handles both Images and Text */}
      <Banner settings={settings} />

      <main className="mx-auto max-w-2xl px-4">
        <CustomerMenu onOpenItem={(item, sizes, options) => setSelectedItem({ item, sizes, options })} />
      </main>

      {selectedItem && (
        <ItemPanel 
          item={selectedItem.item} 
          sizes={selectedItem.sizes} 
          options={selectedItem.options} 
          onClose={() => setSelectedItem(null)} 
        />
      )}

      <CartBar settings={settings} />
    </div>
  );
}