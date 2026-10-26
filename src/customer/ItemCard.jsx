import { useState } from 'react';
import { formatNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';

export default function ItemCard({ item, sizes = [], options = [], onOpen }) {
  const [showImage, setShowImage] = useState(false);
  
  // FIXED: Destructured updateQuantity here
  const { addToCart, getItemQuantity, cart, updateQuantity } = useCart();
  
  const isSoldOut = !item.available;
  const safeSizes = Array.isArray(sizes) ? sizes : [];
  const safeOptions = Array.isArray(options) ? options : [];
  const hasMultipleSizes = safeSizes.length > 0;
  const hasOptions = safeOptions.length > 0;
  const isCustomizable = hasMultipleSizes || hasOptions;

  const displayPrice = hasMultipleSizes ? Math.min(...safeSizes.map(s => s.price)) : item.price;
  const inCartQty = getItemQuantity(item.id);
  const cartItem = cart.find(c => c.item.id === item.id);

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (isCustomizable) {
      onOpen(item, safeSizes, safeOptions);
    } else {
      addToCart({ item, size: null, options: [], quantity: 1, note: '' });
    }
  };

  return (
    <>
      <div
        onClick={() => !isSoldOut && onOpen(item, safeSizes, safeOptions)}
        className={`group flex gap-3 p-3 rounded-2xl border transition-all ${
          isSoldOut ? 'opacity-60 grayscale cursor-not-allowed bg-cream-soft/50 dark:bg-night-surface/50 border-transparent' : 'bg-white dark:bg-night-surface border-cream-line dark:border-night-line shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98]'
        }`}
      >
        <div 
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-soft dark:bg-night-line flex items-center justify-center cursor-zoom-in"
          onClick={(e) => { if (item.image_url && !isSoldOut) { e.stopPropagation(); setShowImage(true); } }}
        >
          {item.image_url ? <img src={item.image_url} alt={item.name} loading="lazy" className="h-full w-full object-cover" /> : <span className="text-2xl">🍽️</span>}
          {item.popular && !isSoldOut && (
            <div className="absolute top-0 left-0 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg uppercase tracking-wide">Popular</div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between py-1">
          <div>
            <h3 className="font-semibold text-ink dark:text-cream leading-tight line-clamp-1">{item.name}</h3>
            {item.description && <p className="text-xs text-ink-muted dark:text-cream/60 line-clamp-2 mt-0.5">{item.description}</p>}
            {hasOptions && !isSoldOut && <p className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 mt-1 uppercase tracking-wide">✦ Customizable</p>}
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <p className="font-bold text-brand-600 dark:text-brand-400">
              {hasMultipleSizes && <span className="text-xs font-normal text-ink-muted mr-1">from</span>}
              {formatNaira(displayPrice)}
            </p>
            
            {isSoldOut ? (
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wide">Sold Out</span>
            ) : (
              <div className="flex items-center">
                {!isCustomizable && inCartQty > 0 ? (
                  <div className="flex items-center gap-2 bg-brand-50 dark:bg-brand-900/30 rounded-lg px-2 py-1 border border-brand-200 dark:border-brand-700">
                    {/* FIXED: updateQuantity is now properly called here */}
                    <button onClick={(e) => { e.stopPropagation(); if(cartItem) updateQuantity(cartItem.cartId, -1); }} className="text-brand-600 font-bold px-1">-</button>
                    <span className="text-sm font-bold text-brand-700 dark:text-brand-300 w-4 text-center">{inCartQty}</span>
                    <button onClick={(e) => { e.stopPropagation(); if(cartItem) updateQuantity(cartItem.cartId, 1); }} className="text-brand-600 font-bold px-1">+</button>
                  </div>
                ) : (
                  <button onClick={handleQuickAdd} className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm transition-colors">
                    Add +
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 animate-fade-in" onClick={() => setShowImage(false)}>
          <img src={item.image_url} alt={item.name} className="max-h-[80vh] max-w-full rounded-2xl object-contain" />
          <button className="absolute top-6 right-6 text-white text-3xl font-light" onClick={() => setShowImage(false)}>✕</button>
        </div>
      )}
    </>
  );
}