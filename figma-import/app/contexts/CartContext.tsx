import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export type CartItemType = 'product' | 'rental' | 'campaign';

export interface CartItem {
  id: string; // Unique ID for the cart line item (e.g., productID + options)
  sourceId: string; // Original ID from database
  type: CartItemType;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: string; // For products (Size/Color)
  rentalPeriod?: { start: string; end: string; days: number }; // For rentals
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  shipping: number;
  total: number;
  progressPercent: number;
  remainingForFreeShipping: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    // Load from local storage on boot
    const saved = localStorage.getItem('unified_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('unified_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, 'id'>) => {
    setItems(current => {
      // Generate a unique ID based on properties to differentiate variants or rental dates
      const uniqueId = newItem.type === 'rental' 
        ? `${newItem.sourceId}-${newItem.rentalPeriod?.start}`
        : `${newItem.sourceId}-${newItem.variant || 'default'}`;

      const existing = current.find(i => i.id === uniqueId);
      
      if (existing) {
        toast.info("Kogus uuendatud", { description: `${newItem.name} on juba ostukorvis.` });
        return current.map(i => i.id === uniqueId ? { ...i, quantity: i.quantity + newItem.quantity } : i);
      }

      toast.success("Lisatud ostukorvi", { description: newItem.name });
      return [...current, { ...newItem, id: uniqueId }];
    });
  };

  const removeItem = (id: string) => {
    setItems(current => current.filter(i => i.id !== id));
    toast.info("Eemaldatud ostukorvist");
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems(current => current.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setItems([]);

  // Calculations
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    if (item.type === 'rental' && item.rentalPeriod) {
       return sum + (item.price * item.rentalPeriod.days * item.quantity);
    }
    return sum + (item.price * item.quantity);
  }, 0);

  const freeShippingThreshold = 50;
  // Rentals usually don't have shipping, but for simplicity let's keep logic universal or exclude rentals if needed
  const shipping = subtotal >= freeShippingThreshold ? 0 : 4.90; 
  const total = subtotal + shipping;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      cartCount,
      subtotal,
      shipping,
      total,
      progressPercent,
      remainingForFreeShipping
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}