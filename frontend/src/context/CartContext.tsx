import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCart,
  addToCart as apiAdd,
  removeFromCart as apiRemove,
  updateCartQuantity as apiUpdate,
  clearCart as apiClear,
  type PaginatedResponse,
  type CartItem,
} from '../services/cart.api';
import type { Product } from '@tienda-virtual/shared-types';
import { apiError } from '../utils/apiError';

import { CART_SESSION_CHANGED, clearCheckoutRequest } from '../services/session-storage';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  loading: boolean;
  busy: boolean;
  error: string | null;
  notice: string | null;
  addToCart: (id: number, quantity?: number) => Promise<boolean>;
  removeFromCart: (id: number) => Promise<boolean>;
  updateQuantity: (id: number, quantity: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}
const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  const { data: cartData, isLoading, isError, refetch } = useQuery<PaginatedResponse<CartItem>>({
    queryKey: ['cart'],
    queryFn: () => getCart(),
    refetchOnWindowFocus: false,
  });

  const cartItems = cartData?.items || [];

  useEffect(() => {
    const reset = () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setNotice(null);
    };
    window.addEventListener(CART_SESSION_CHANGED, reset);
    return () => window.removeEventListener(CART_SESSION_CHANGED, reset);
  }, [queryClient]);

  const refreshCart = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const applyOptimisticAdd = useCallback((productId: number, quantity: number, product?: Product) => {
    queryClient.setQueryData<PaginatedResponse<CartItem>>(['cart'], (old) => {
      if (!old) return old;
      const existingIndex = old.items.findIndex((item) => item.productId === productId);
      if (existingIndex >= 0) {
        return {
          ...old,
          items: old.items.map((item, idx) =>
            idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item
          ),
        };
      }
      return {
        ...old,
        items: [
          ...old.items,
          {
            id: Date.now(),
            cartId: 0,
            productId,
            quantity,
            createdAt: new Date().toISOString(),
            product,
          } as CartItem,
        ],
      };
    });
  }, [queryClient]);

  const applyOptimisticRemove = useCallback((cartItemId: number) => {
    queryClient.setQueryData<PaginatedResponse<CartItem>>(['cart'], (old) => {
      if (!old) return old;
      return { ...old, items: old.items.filter((item) => item.id !== cartItemId) };
    });
  }, [queryClient]);

  const applyOptimisticUpdate = useCallback((cartItemId: number, quantity: number) => {
    queryClient.setQueryData<PaginatedResponse<CartItem>>(['cart'], (old) => {
      if (!old) return old;
      return {
        ...old,
        items: old.items.map((item) => (item.id === cartItemId ? { ...item, quantity } : item)),
      };
    });
  }, [queryClient]);

  const mutateWithOptimistic = useCallback(
    async (
      optimisticUpdate: () => void,
      apiCall: () => Promise<unknown>,
      options: { added?: boolean; onError?: () => void } = {}
    ) => {
      setBusy(true);
      setError(null);
      setNotice(null);
      
      try {
        optimisticUpdate();
        if (options.added) setNotice('added');
        
        await apiCall();
        clearCheckoutRequest();
        return true;
      } catch (err) {
        // Rollback by invalidating cache
        queryClient.invalidateQueries({ queryKey: ['cart'] });
        setError(apiError(err));
        options.onError?.();
        return false;
      } finally {
        setBusy(false);
      }
    },
    [queryClient]
  );

  const addToCart = useCallback(
    async (productId: number, quantity = 1) => {
      return mutateWithOptimistic(
        () => applyOptimisticAdd(productId, quantity),
        () => apiAdd(productId, quantity),
        { added: true }
      );
    },
    [applyOptimisticAdd, mutateWithOptimistic]
  );

  const removeFromCart = useCallback(
    async (cartItemId: number) => {
      return mutateWithOptimistic(
        () => applyOptimisticRemove(cartItemId),
        () => apiRemove(cartItemId)
      );
    },
    [applyOptimisticRemove, mutateWithOptimistic]
  );

  const updateQuantity = useCallback(
    async (cartItemId: number, quantity: number) => {
      return mutateWithOptimistic(
        () => applyOptimisticUpdate(cartItemId, quantity),
        () => apiUpdate(cartItemId, quantity)
      );
    },
    [applyOptimisticUpdate, mutateWithOptimistic]
  );

  const clearCart = useCallback(async () => {
    return mutateWithOptimistic(
      () => queryClient.setQueryData<PaginatedResponse<CartItem>>(['cart'], (old) => old ? { ...old, items: [] } : old),
      () => apiClear()
    );
  }, [queryClient, mutateWithOptimistic]);

  const totalCents = cartItems.reduce(
    (sum, item) => sum + Math.round((item.product?.price || 0) * 100) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        cartTotal: totalCents / 100,
        loading: isLoading,
        busy,
        error: isError ? apiError(new Error('Failed to load cart')) : error,
        notice,
        refreshCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
