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

// ── DEV MODE ──────────────────────────────────────────────────────────
// Authentification locale sans serveur. Mettre à false pour ré-activer
// la vraie validation backend.
const DEV_AUTH = true;

function makeFakeUser(email: string, type_user: TypeUtilisateur): Utilisateur {
  return {
    id: 'dev-' + email,
    email,
    type: type_user,
    nom: email.split('@')[0],
    prenom: null,
    actif: true,
  };
}
// ──────────────────────────────────────────────────────────────────────

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
          if (DEV_AUTH) {
            // Reconstruit l'utilisateur depuis le pseudo-token stocké
            const [email, type] = stored.split('|');
            setUser(makeFakeUser(email, (type as TypeUtilisateur) ?? 'ENSEIGNANT'));
          } else {
            try {
              const me = await api.me();
              setUser(me);
            } catch {
              await SecureStore.deleteItemAsync(TOKEN_KEY);
              applyToken(null);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, _motDePasse: string) => {
    if (DEV_AUTH) {
      const fakeToken = `${email}|ENSEIGNANT`;
      await SecureStore.setItemAsync(TOKEN_KEY, fakeToken);
      applyToken(fakeToken);
      setUser(makeFakeUser(email, 'ENSEIGNANT'));
      return;
    }
    const t = await api.connecter(email, _motDePasse);
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
    if (DEV_AUTH) {
      const fakeToken = `${payload.email}|${payload.type_user}`;
      await SecureStore.setItemAsync(TOKEN_KEY, fakeToken);
      applyToken(fakeToken);
      setUser(makeFakeUser(payload.email, payload.type_user));
      return;
    }
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
    if (DEV_AUTH) return;
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
