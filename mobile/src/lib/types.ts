export type TypeUtilisateur = 'ETUDIANT' | 'ENSEIGNANT' | 'ADMIN';

export type NiveauAcces = 'PUBLIC' | 'CAMPUS' | 'PRIVE';

export type TypeDocument =
  | 'COURS'
  | 'TD'
  | 'TP'
  | 'EXAMEN'
  | 'CORRECTION'
  | 'SUPPORT'
  | 'MEMOIRE'
  | 'THESE'
  | 'ARTICLE'
  | 'RAPPORT'
  | 'AUTRE';

export interface Utilisateur {
  id: string;
  email: string;
  type: TypeUtilisateur;
  nom?: string | null;
  prenom?: string | null;
  actif: boolean;
}

export interface Ressource {
  id: string;
  titre: string;
  type_document: string;
  categorie: string;
  niveau_acces: string;
  annee?: number | null;
  description?: string | null;
  publiee: boolean;
  doi?: string | null;
  proprietaire_id: string;
}

export interface Fichier {
  id: string;
  nom_original: string;
  taille_octets: number;
  type_mime: string;
  url: string | null;
}

export interface SourceRAG {
  chunk_id: string;
  ressource_id: string;
  contenu: string;
  score: number;
}

export interface ReponseRAG {
  reponse: string;
  sources: SourceRAG[];
}
