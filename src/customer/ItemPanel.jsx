import { useState, useMemo, useEffect } from 'react';
import { formatNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';

export default function ItemPanel({ item, sizes = [], options = [], onClose }) {
  const { addToCart, getItemQuantity } = useCart();
  
  // Get current amount in cart
  const inCartQty = getItemQuantity(item.id);

  // State
  const [selectedSize, setSelectedSize] = useState(sizes.length > 0 ? sizes[0] : null);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  
  // Group options 
  const groupedOptions = useMemo(() => {
    const groups = {};
    options.forEach((opt) => {
      if (!groups[opt.group_name]) groups[opt.group_name] = [];
      groups[opt.group_name].push(opt);
    });
    return groups;
  }, [options]);

  const [selectedOptions, setSelectedOptions] = useState({});

  useEffect(() => {
    const initial = {};
    Object.keys(groupedOptions).forEach((groupName) => {
      initial[groupName] = groupedOptions[groupName][0].label;
    });
    setSelectedOptions(initial);
  }, [groupedOptions]);

  const unitPrice = selectedSize ? selectedSize.price : item.price;
  const liveTotal = unitPrice * quantity;

  const handleAdd = () => {
    const chosenOptions = Object.entries(selectedOptions).map(([group_name, label]) => {
      const optData = options.find(o => o.group_name === group_name && o.label === label);
      return optData ? { group_name, label, id: optData.id } : null;
    }).filter(Boolean);

    addToCart({
      item,
      size: selectedSize,
      options: chosenOptions,
      quantity,
      note
    });
    onClose();
  };

  const stopPropagation = (e) => e.stopPropagation();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-night-surface rounded-t-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up"
        onClick={stopPropagation}
      >
        
        {/* Header */}
        <div className="relative p-5 border-b border-cream-line dark:border-night-line shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full bg-cream-soft dark:bg-night-line text-ink-muted hover:text-ink dark:hover:text-cream"
          >
            ✕
          </button>
          <h2 className="text-xl font-bold pr-8">{item.name}</h2>
          {item.description && (
            <p className="text-sm text-ink-muted mt-1">{item.description}</p>
          )}
          
          {/* NEW: Show how many are already in the cart */}
          {inCartQty > 0 && (
            <div className="mt-3 inline-block bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold px-3 py-1 rounded-full border border-brand-200 dark:border-brand-700">
              You already have {inCartQty} in your cart
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          
          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Select Size <span className="text-brand-600">*</span></h3>
              <div className="grid grid-cols-2 gap-2">
                {sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`p-3 rounded-xl border flex justify-between items-center text-sm font-medium transition-colors ${
                      selectedSize?.id === size.id
                        ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                        : 'border-cream-line dark:border-night-line hover:border-brand-300'
                    }`}
                  >
                    <span>{size.label}</span>
                    <span>{formatNaira(size.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Options */}
          {Object.entries(groupedOptions).map(([groupName, groupOptions]) => (
            <div key={groupName}>
              <h3 className="font-semibold mb-3">Select {groupName} <span className="text-brand-600">*</span></h3>
              <div className="flex flex-wrap gap-2">
                {groupOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedOptions(prev => ({ ...prev, [groupName]: opt.label }))}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                      selectedOptions[groupName] === opt.label
                        ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                        : 'border-cream-line dark:border-night-line hover:border-brand-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Note */}
          <div>
            <h3 className="font-semibold mb-2">Special Instructions</h3>
            <textarea
              placeholder="e.g. No pepper, extra stew..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-cream-soft dark:bg-night-line border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cream-line dark:border-night-line bg-white dark:bg-night-surface shrink-0 flex gap-4 items-center">
          <div className="flex items-center gap-3 bg-cream-soft dark:bg-night-line rounded-full px-2 py-1">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-8 w-8 rounded-full bg-white dark:bg-night-surface shadow-sm flex items-center justify-center font-bold"
            >-</button>
            <span className="font-semibold w-4 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="h-8 w-8 rounded-full bg-white dark:bg-night-surface shadow-sm flex items-center justify-center font-bold"
            >+</button>
          </div>
          
          <button 
            onClick={handleAdd}
            className="btn-primary flex-1 !rounded-xl"
          >
            {/* NEW: Button text changes based on cart state */}
            {inCartQty > 0 ? `Add ${quantity} More • ` : `Add • `} 
            {formatNaira(liveTotal)}
          </button>
        </div>

      </div>
    </div>
  );
}