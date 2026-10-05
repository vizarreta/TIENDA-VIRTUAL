import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCart,
  addToCart as apiAdd,
  removeFromCart as apiRemove,
  updateCartQuantity as apiUpdate,
  clearCart as apiClear,
  type PaginatedResponse,
  type CartItem,
} from '../services/cart.api';

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      apiAdd(productId, quantity),
    onMutate: async ({ productId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<PaginatedResponse<CartItem>>(['cart']);
      
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
            } as CartItem,
          ],
        };
      });
      
      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cartItemId: number) => apiRemove(cartItemId),
    onMutate: async (cartItemId) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<PaginatedResponse<CartItem>>(['cart']);
      
      queryClient.setQueryData<PaginatedResponse<CartItem>>(['cart'], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.filter((item) => item.id !== cartItemId),
        };
      });
      
      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useUpdateCartQuantity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) =>
      apiUpdate(cartItemId, quantity),
    onMutate: async ({ cartItemId, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<PaginatedResponse<CartItem>>(['cart']);
      
      queryClient.setQueryData<PaginatedResponse<CartItem>>(['cart'], (old) => {
        if (!old) return old;
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === cartItemId ? { ...item, quantity } : item
          ),
        };
      });
      
      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClear(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['cart'] });
      const previousCart = queryClient.getQueryData<PaginatedResponse<CartItem>>(['cart']);
      queryClient.setQueryData<PaginatedResponse<CartItem>>(['cart'], (old) => 
        old ? { ...old, items: [] } : { items: [], total: 0, page: 1, limit: 20, totalPages: 0 }
      );
      return { previousCart };
    },
    onError: (err, variables, context) => {
      if (context?.previousCart) {
        queryClient.setQueryData(['cart'], context.previousCart);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
}