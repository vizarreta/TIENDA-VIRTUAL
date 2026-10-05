import axios from 'axios';
import { getAuthToken, getCartSessionId } from './session-storage';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

httpClient.interceptors.request.use((request) => {
  request.headers['x-session-id'] = getCartSessionId();
  const token = getAuthToken();
  // OAuth supplies its own bearer token during the session exchange.
  if (token && !request.headers.Authorization) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});
