import { useState } from 'react';
import { formatNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import CartSheet from './CartSheet.jsx';

export default function CartBar({ settings }) {
  const { cartCount, cartTotal } = useCart();
  const [isOpen, setIsOpen] = useState(false);

  if (cartCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe bg-gradient-to-t from-cream dark:from-night to-transparent pointer-events-none">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full max-w-2xl mx-auto flex items-center justify-between bg-brand-600 hover:bg-brand-700 text-white p-4 rounded-2xl shadow-lg pointer-events-auto transition-transform active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <span className="bg-white/20 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm">
              {cartCount}
            </span>
            <span className="font-semibold">View Cart</span>
          </div>
          <span className="font-bold text-lg">{formatNaira(cartTotal)}</span>
        </button>
      </div>

      {isOpen && <CartSheet settings={settings} onClose={() => setIsOpen(false)} />}
    </>
  );
}