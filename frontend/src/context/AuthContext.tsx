import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import type { AuthUser, UserSession } from '@tienda-virtual/shared-types';
import {
  getMe,
  login as apiLogin,
  register as apiRegister,
  verifyOAuth,
} from '../services/auth.api';
import { getAuthToken, setAuthToken, resetCartSession } from '../services/session-storage';
import { supabase, oauthEnabled } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  loginWithOAuth: (provider: 'google' | 'github' | 'apple') => Promise<void>;
  completeOAuth: () => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
  oauthEnabled: boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const revision = useRef(0);
  const oauthPending = useRef<{ token: string; promise: Promise<void> } | null>(null);

  const acceptSession = useCallback((data: UserSession) => {
    if (!data.access_token || !data.user?.id) throw new Error('Invalid session');
    revision.current++;
    setAuthToken(data.access_token);
    setUser(data.user);
    setLoading(false);
  }, []);

  const syncOAuth = useCallback(
    (token: string) => {
      if (oauthPending.current?.token === token) return oauthPending.current.promise;
      const version = revision.current;
      const promise = verifyOAuth(token)
        .then(({ data }) => {
          if (version === revision.current) acceptSession(data);
        })
        .finally(() => {
          if (oauthPending.current?.token === token) oauthPending.current = null;
        });
      oauthPending.current = { token, promise };
      return promise;
    },
    [acceptSession]
  );

  const completeOAuth = useCallback(async () => {
    if (!supabase) throw new Error('OAuth unavailable');
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) throw error || new Error('Missing OAuth session');
    await syncOAuth(data.session.access_token);
  }, [syncOAuth]);

  useEffect(() => {
    let mounted = true;
    const version = revision.current;
    const restore = async () => {
      try {
        if (getAuthToken()) {
          const { data } = await getMe();
          if (mounted && version === revision.current) setUser(data);
        }
      } catch {
        if (mounted && version === revision.current) {
          setAuthToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void restore();
    // The callback stays synchronous to avoid the Supabase auth lock.
    const subscription = supabase?.auth.onAuthStateChange((event, session) => {
      if (
        (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') &&
        session
      ) {
        setTimeout(() => {
          if (mounted)
            void syncOAuth(session.access_token).catch(() => {
              /* Callback page presents OAuth errors. */
            });
        }, 0);
      }
    }).data.subscription;
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [syncOAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      acceptSession((await apiLogin(email, password)).data);
      return true;
    },
    [acceptSession]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      acceptSession((await apiRegister(email, password, name)).data);
      return true;
    },
    [acceptSession]
  );

  const loginWithOAuth = useCallback(async (provider: 'google' | 'github' | 'apple') => {
    if (!supabase) throw new Error('OAuth unavailable');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    revision.current++;
    setAuthToken(null);
    setUser(null);
    resetCartSession();
    await supabase?.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginWithOAuth,
        completeOAuth,
        logout,
        isAdmin: user?.role === 'admin',
        oauthEnabled,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
