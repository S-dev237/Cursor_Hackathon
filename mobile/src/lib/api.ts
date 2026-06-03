import { API_BASE } from './config';
import type {
  Utilisateur,
  Ressource,
  Fichier,
  ReponseRAG,
  TypeUtilisateur,
  NiveauAcces,
  TypeDocument,
} from './types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type TokenGetter = () => string | null;

let tokenGetter: TokenGetter = () => null;

/** Branche le fournisseur de token (appelé par AuthProvider). */
export function setTokenGetter(getter: TokenGetter) {
  tokenGetter = getter;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = tokenGetter();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch (e) {
    throw new ApiError(
      "Impossible de joindre le serveur. Vérifiez l'URL de l'API et votre réseau.",
      0,
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail =
      (data && (data.detail || data.message)) || `Erreur ${response.status}`;
    const msg = Array.isArray(detail)
      ? detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(', ')
      : String(detail);
    throw new ApiError(msg, response.status);
  }

  return data as T;
}

export const api = {
  // ── Authentification ──────────────────────────────────────────────
  async connecter(email: string, motDePasse: string): Promise<string> {
    const res = await request<{ access_token: string }>('/auth/connecter', {
      method: 'POST',
      body: JSON.stringify({ email, mot_de_passe: motDePasse }),
    });
    return res.access_token;
  },

  async inscrire(payload: {
    email: string;
    mot_de_passe: string;
    type_user: TypeUtilisateur;
    nom?: string;
    prenom?: string;
  }): Promise<void> {
    await request('/auth/inscrire', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  me(): Promise<Utilisateur> {
    return request<Utilisateur>('/auth/me');
  },

  // ── Documents ─────────────────────────────────────────────────────
  listerRessources(params: {
    mine?: boolean;
    type_doc?: string;
    categorie?: string;
    q?: string;
  } = {}): Promise<Ressource[]> {
    const qs = new URLSearchParams();
    if (params.mine) qs.set('mine', 'true');
    if (params.type_doc) qs.set('type_doc', params.type_doc);
    if (params.categorie) qs.set('categorie', params.categorie);
    if (params.q) qs.set('q', params.q);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<Ressource[]>(`/ressources${suffix}`);
  },

  lireRessource(id: string): Promise<Ressource> {
    return request<Ressource>(`/ressources/${id}`);
  },

  creerRessource(payload: {
    titre: string;
    type_document: TypeDocument;
    niveau_acces: NiveauAcces;
    annee?: number;
    description?: string;
  }): Promise<{ id: string }> {
    return request<{ id: string }>('/ressources/', {
      method: 'POST',
      body: JSON.stringify({ ...payload, ue_ids: [] }),
    });
  },

  async uploaderFichier(
    ressourceId: string,
    file: { uri: string; name: string; mimeType?: string },
  ): Promise<{ fichier_id: string }> {
    const form = new FormData();
    // React Native FormData accepte cet objet pour les fichiers
    form.append('fichier', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? 'application/pdf',
    } as any);
    return request<{ fichier_id: string }>(
      `/ressources/${ressourceId}/fichiers`,
      { method: 'POST', body: form },
    );
  },

  listerFichiers(ressourceId: string): Promise<Fichier[]> {
    return request<Fichier[]>(`/ressources/${ressourceId}/fichiers`);
  },

  supprimerRessource(id: string): Promise<void> {
    return request<void>(`/ressources/${id}`, { method: 'DELETE' });
  },

  // ── Assistant IA (RAG) ────────────────────────────────────────────
  poserQuestion(question: string, nbContextes = 5): Promise<ReponseRAG> {
    return request<ReponseRAG>('/rag/question', {
      method: 'POST',
      body: JSON.stringify({ question, nb_contextes: nbContextes }),
    });
  },
};
