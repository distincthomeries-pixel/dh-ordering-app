import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('dh_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('dh_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (newItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.item.id === newItem.item.id &&
          i.size?.label === newItem.size?.label &&
          JSON.stringify(i.options) === JSON.stringify(newItem.options) &&
          i.note === newItem.note
      );

      if (existingIndex >= 0) {
        const newCart = [...prev];
        newCart[existingIndex].quantity += newItem.quantity;
        return newCart;
      }
      return [...prev, { ...newItem, cartId: crypto.randomUUID() }];
    });
  };

  const removeFromCart = (cartId) => setCart((prev) => prev.filter((i) => i.cartId !== cartId));
  
  // FIXED: If quantity hits 0, it filters the item out completely
  const updateQuantity = (cartId, delta) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.cartId === cartId) {
            return { ...i, quantity: i.quantity + delta };
          }
          return i;
        })
        .filter((i) => i.quantity > 0); // <-- This removes the item if it hits 0
    });
  };

  const clearCart = () => setCart([]);

  const getItemQuantity = (itemId) => {
    return cart.filter(c => c.item.id === itemId).reduce((sum, c) => sum + c.quantity, 0);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = cart.reduce((sum, i) => {
    const price = i.size ? i.size.price : i.item.price;
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, getItemQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);