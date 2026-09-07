import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  let sessionId = localStorage.getItem('x-session-id');
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem('x-session-id', sessionId);
  }
  config.headers['x-session-id'] = sessionId;
  return config;
});

export const getProducts = () => api.get('/products');
export const searchProducts = (query: string) => api.get(`/products/search?q=${encodeURIComponent(query)}`);
export const getCart = () => api.get('/cart');
export const addToCart = (productId: number, quantity: number) => api.post('/cart', { productId, quantity });
export const removeFromCart = (cartItemId: number) => api.delete(`/cart/${cartItemId}`);
export const updateCartQuantity = (cartItemId: number, quantity: number) => api.patch(`/cart/${cartItemId}`, { quantity });
export const clearCart = () => api.delete('/cart/clear');

export default api;
