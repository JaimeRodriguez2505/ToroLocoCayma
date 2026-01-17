'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { EcommerceProduct } from '@/lib/types';

export type CartItem = EcommerceProduct & {
  quantity: number;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: EcommerceProduct) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  isCartOpen: boolean;
  total: number;
  itemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const savedCart = localStorage.getItem('toro_loco_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Error parsing cart from localStorage', e);
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('toro_loco_cart', JSON.stringify(items));
    }
  }, [items, isMounted]);

  const addToCart = (product: EcommerceProduct) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id_producto === product.id_producto);
      if (existing) {
        return prev.map((item) =>
          item.id_producto === product.id_producto
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    // setIsCartOpen(true); // Removed per user request to not auto-open cart
  };

  const removeFromCart = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.id_producto !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id_producto === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  const total = items.reduce((sum, item) => {
    const price = item.es_oferta ? parseFloat(item.precio_oferta!) : parseFloat(item.precio);
    return sum + price * item.quantity;
  }, 0);

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleCart,
        isCartOpen,
        total,
        itemsCount,
      }}
    >
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