import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { api, setTokenGetter } from './api';
import type { Utilisateur, TypeUtilisateur } from './types';

const TOKEN_KEY = 'acadoc_token';

interface AuthState {
  token: string | null;
  user: Utilisateur | null;
  loading: boolean;
  signIn: (email: string, motDePasse: string) => Promise<void>;
  signUp: (payload: {
    email: string;
    mot_de_passe: string;
    type_user: TypeUtilisateur;
    nom?: string;
    prenom?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<Utilisateur | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRef = useRef<string | null>(null);

  // Le client API lit toujours le token courant via cette ref
  setTokenGetter(() => tokenRef.current);

  const applyToken = (t: string | null) => {
    tokenRef.current = t;
    setToken(t);
  };

  useEffect(() => {
    (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (stored) {
          applyToken(stored);
          try {
            const me = await api.me();
            setUser(me);
          } catch {
            // Token expiré / invalide
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            applyToken(null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, motDePasse: string) => {
    const t = await api.connecter(email, motDePasse);
    await SecureStore.setItemAsync(TOKEN_KEY, t);
    applyToken(t);
    const me = await api.me();
    setUser(me);
  };

  const signUp = async (payload: {
    email: string;
    mot_de_passe: string;
    type_user: TypeUtilisateur;
    nom?: string;
    prenom?: string;
  }) => {
    await api.inscrire(payload);
    await signIn(payload.email, payload.mot_de_passe);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    applyToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!tokenRef.current) return;
    const me = await api.me();
    setUser(me);
  };

  const value = useMemo<AuthState>(
    () => ({ token, user, loading, signIn, signUp, signOut, refreshUser }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
