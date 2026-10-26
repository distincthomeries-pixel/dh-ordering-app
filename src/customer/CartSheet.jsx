import { useState } from 'react';
import { formatNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import CheckoutSheet from './CheckoutSheet.jsx';

export default function CartSheet({ onClose, settings }) {
  // Added clearCart to the destructured context
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const stopPropagation = (e) => e.stopPropagation();

  if (showCheckout) {
    return <CheckoutSheet settings={settings} onClose={onClose} />;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-night-surface rounded-t-3xl shadow-xl flex flex-col max-h-[85vh] animate-slide-up"
        onClick={stopPropagation}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cream-line dark:border-night-line">
          <h2 className="text-xl font-bold font-display">Your Order</h2>
          
          <div className="flex items-center gap-4">
            {/* Clear All Button */}
            {cart.length > 0 && (
              <button 
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear your entire cart?')) {
                    clearCart();
                  }
                }} 
                className="text-xs text-red-500 font-bold hover:underline"
              >
                Clear All
              </button>
            )}
            
            <button onClick={onClose} className="text-ink-muted hover:text-ink dark:hover:text-cream">✕</button>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-10 text-ink-muted">
              Your cart is empty.
            </div>
          ) : (
            cart.map((cartItem) => {
              const { cartId, item, size, options, quantity, note } = cartItem;
              const unitPrice = size ? size.price : item.price;
              
              return (
                <div key={cartId} className="flex gap-3 border-b border-cream-line dark:border-night-line pb-4 last:border-0">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    
                    {/* Badges for options/sizes */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {size && (
                        <span className="text-[10px] font-bold bg-cream-soft dark:bg-night-line px-1.5 py-0.5 rounded text-ink-muted">
                          {size.label}
                        </span>
                      )}
                      {options && options.map(opt => (
                        <span key={opt.id || opt.label} className="text-[10px] font-bold bg-cream-soft dark:bg-night-line px-1.5 py-0.5 rounded text-ink-muted">
                          {opt.label}
                        </span>
                      ))}
                    </div>
                    
                    {note && <p className="text-xs text-brand-600 mt-1 italic">"{note}"</p>}
                    <p className="text-sm font-bold mt-2">{formatNaira(unitPrice * quantity)}</p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <div className="flex items-center gap-2 bg-cream-soft dark:bg-night-line rounded-lg px-2 py-1">
                      <button onClick={() => updateQuantity(cartId, -1)} className="text-lg leading-none px-1">-</button>
                      <span className="text-sm font-semibold w-4 text-center">{quantity}</span>
                      <button onClick={() => updateQuantity(cartId, 1)} className="text-lg leading-none px-1">+</button>
                    </div>
                    <button onClick={() => removeFromCart(cartId)} className="text-xs text-red-500 hover:underline mt-2">Remove</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-cream-line dark:border-night-line bg-cream/50 dark:bg-night/50">
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Subtotal</span>
              <span>{formatNaira(cartTotal)}</span>
            </div>
            <button 
              onClick={() => setShowCheckout(true)}
              className="btn-primary w-full !rounded-xl"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}