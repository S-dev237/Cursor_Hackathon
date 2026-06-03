import { colors } from './theme';
import type { TypeDocument } from './types';

export const TYPE_LABELS: Record<string, string> = {
  COURS: 'Cours',
  TD: 'TD',
  TP: 'TP',
  EXAMEN: 'Examen',
  CORRECTION: 'Correction',
  SUPPORT: 'Support',
  MEMOIRE: 'Mémoire',
  THESE: 'Thèse',
  ARTICLE: 'Article',
  RAPPORT: 'Rapport',
  AUTRE: 'Autre',
};

export const TYPE_ICONS: Record<string, string> = {
  COURS: 'book',
  TD: 'pencil',
  TP: 'flask',
  EXAMEN: 'document-text',
  CORRECTION: 'checkmark-done',
  SUPPORT: 'easel',
  MEMOIRE: 'school',
  THESE: 'ribbon',
  ARTICLE: 'newspaper',
  RAPPORT: 'clipboard',
  AUTRE: 'document',
};

export const CATEGORIE_LABELS: Record<string, string> = {
  RESSOURCE_PEDAGOGIQUE: 'Ressource pédagogique',
  PRODUCTION_SCIENTIFIQUE: 'Production scientifique',
  AUTRE: 'Autre',
};

export const ACCES_LABELS: Record<string, string> = {
  PUBLIC: 'Public',
  CAMPUS: 'Campus',
  PRIVE: 'Privé',
};

export function accesColor(niveau: string): string {
  switch (niveau) {
    case 'PUBLIC':
      return colors.accesPublic;
    case 'CAMPUS':
      return colors.accesCampus;
    case 'PRIVE':
      return colors.accesPrive;
    default:
      return colors.textMuted;
  }
}

export const TYPES_PEDAGOGIQUES: TypeDocument[] = [
  'COURS',
  'TD',
  'TP',
  'EXAMEN',
  'CORRECTION',
  'SUPPORT',
];

export const TYPES_SCIENTIFIQUES: TypeDocument[] = [
  'MEMOIRE',
  'THESE',
  'ARTICLE',
  'RAPPORT',
];

export function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(0)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}

export function initiales(u: {
  nom?: string | null;
  prenom?: string | null;
  email: string;
}): string {
  const p = (u.prenom ?? '').trim();
  const n = (u.nom ?? '').trim();
  if (p || n) return `${p.charAt(0)}${n.charAt(0)}`.toUpperCase();
  return u.email.charAt(0).toUpperCase();
}
