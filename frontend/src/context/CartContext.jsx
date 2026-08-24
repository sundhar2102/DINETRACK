import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Add or increment item
  const addItem = (item, restInfo, quantity = 1, customization = '') => {
    // If adding from a different restaurant, prompt to reset or reset
    if (restaurant && restaurant.id !== restInfo.id) {
      if (confirm(`You have items from ${restaurant.name} in your cart. Start a new order with ${restInfo.name}?`)) {
        setCartItems([{ ...item, quantity, customization }]);
        setRestaurant(restInfo);
        setIsDrawerOpen(true);
      }
      return;
    }

    setRestaurant(restInfo);
    setCartItems(prev => {
      const existingIdx = prev.findIndex(i => i.id === item.id && i.customization === customization);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += quantity;
        return updated;
      }
      return [...prev, { ...item, quantity, customization }];
    });
    setIsDrawerOpen(true);
  };

  const updateQuantity = (itemId, customization, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId, customization);
      return;
    }
    setCartItems(prev =>
      prev.map(i => (i.id === itemId && i.customization === customization ? { ...i, quantity: newQuantity } : i))
    );
  };

  const removeItem = (itemId, customization) => {
    setCartItems(prev => {
      const filtered = prev.filter(i => !(i.id === itemId && i.customization === customization));
      if (filtered.length === 0) {
        setRestaurant(null);
      }
      return filtered;
    });
  };

  const clearCart = () => {
    setCartItems([]);
    setRestaurant(null);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + tax;
  const totalItemsCount = cartItems.reduce((count, item) => count + item.quantity, 0);
  const maxPrepTime = cartItems.length > 0 ? Math.max(...cartItems.map(i => Number(i.prep_time_minutes || 15))) : 0;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        restaurant,
        isDrawerOpen,
        setIsDrawerOpen,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        subtotal,
        tax,
        total,
        totalItemsCount,
        maxPrepTime
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
