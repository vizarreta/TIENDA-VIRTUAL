import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getCart, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart, updateCartQuantity as apiUpdateCartQuantity, clearCart as apiClearCart } from '../services/api';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
  category: string;
}

export interface CartItem {
  id: number;
  quantity: number;
  productId: number;
  product: Product;
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  removeFromCart: (cartItemId: number) => Promise<void>;
  updateQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * 🔴 FUNCIÓN STATEFUL (Con Estado)
 * 
 * Este Context mantiene ESTADO INTERNO que cambia durante la sesión:
 * - cartItems: Array de productos en el carrito (MUTA con cada acción)
 * - cartCount: Número total de items (SE RECALCULA dinámicamente)
 * - cartTotal: Subtotal en dinero (SE RECALCULA dinámicamente)
 * 
 * Usa useState para almacenar datos que PERSISTEN y CAMBIAN.
 * Cada cambio de estado provoca un RE-RENDER de los componentes consumidores.
 */
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState<number>(0);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCart();
      const items = response.data.items || [];
      setCartItems(items);
      
      const count = items.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);
      const total = items.reduce((acc: number, item: CartItem) => acc + (item.product.price * item.quantity), 0);
      
      setCartCount(count);
      setCartTotal(total);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: number, quantity: number = 1) => {
    await apiAddToCart(productId, quantity);
    await refreshCart();
  };

  const removeFromCart = async (cartItemId: number) => {
    await apiRemoveFromCart(cartItemId);
    await refreshCart();
  };

  const updateQuantity = async (cartItemId: number, quantity: number) => {
    await apiUpdateCartQuantity(cartItemId, quantity);
    await refreshCart();
  };

  const clearCart = async () => {
    await apiClearCart();
    await refreshCart();
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      cartTotal,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
