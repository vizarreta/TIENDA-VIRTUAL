import type { AuthUser, UserSession } from '@tienda-virtual/shared-types';
import { httpClient } from './http-client';

/** @returns Sesion local; rechaza credenciales invalidas mediante un error HTTP. */
export const login = (email: string, password: string) =>
  httpClient.post<UserSession>('/auth/login', { email, password });
export const register = (email: string, password: string, fullName: string) =>
  httpClient.post<UserSession>('/auth/register', { email, password, fullName });
export const getMe = () => httpClient.get<AuthUser>('/auth/me');
/** @param token JWT del proveedor. @returns Sesion local validada por el backend. */
export const verifyOAuth = (token: string) =>
  httpClient.post<UserSession>(
    '/auth/supabase/verify',
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
