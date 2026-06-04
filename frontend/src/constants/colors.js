// Design tokens — OpenScience Hub
// Source de vérité partagée avec tailwind.config.js

export const COLORS = {
  navy: { DEFAULT: '#0B1929', mid: '#132337' },
  teal: {
    DEFAULT: '#1D9E75',
    light: '#E1F5EE',
    mid: '#5DCAA5',
    dark: '#0F6E56',
    border: '#9FE1CB',
  },
  gray: {
    bg: '#F4F3EF',
    border: '#D3D1C7',
    muted: '#888780',
    text: '#2C2C2A',
    light: '#F1EFE8',
  },
  amber: { light: '#FAEEDA', DEFAULT: '#BA7517', dark: '#633806' },
}

/** @typedef {'thesis'|'memoir'|'article'|'report'} DocType */

// Couleurs des badges par type de document
export const DOC_TYPE_COLORS = {
  thesis: { bg: '#EEEDFE', text: '#534AB7' },
  memoir: { bg: '#E6F1FB', text: '#185FA5' },
  article: { bg: '#E1F5EE', text: '#085041' },
  report: { bg: '#FAEEDA', text: '#633806' },
}

export const DOC_TYPE_LABELS = {
  thesis: 'Thèse',
  memoir: 'Mémoire',
  article: 'Article',
  report: 'Rapport',
}

export const DOC_TYPES = ['thesis', 'memoir', 'article', 'report']

/** @typedef {'draft'|'published'|'withdrawn'} DocStatus */

// Statuts de publication (auto-publication par l'auteur)
export const STATUS = {
  draft: {
    label: 'Brouillon',
    cls: 'border-amber bg-amber-light text-amber-dark dark:border-amber/40 dark:bg-amber/15 dark:text-amber-light',
  },
  published: {
    label: 'Publié',
    cls: 'border-teal-mid bg-teal-light text-teal-dark dark:border-teal-500/40 dark:bg-teal-500/15 dark:text-teal-300',
  },
  withdrawn: {
    label: 'Retiré',
    cls: 'border-gray-border bg-gray-light text-gray-muted dark:border-navy-700 dark:bg-navy-900 dark:text-gray-400',
  },
}

export const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'published', label: 'Publié' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'withdrawn', label: 'Retiré' },
]

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'date', label: 'Date' },
  { value: 'downloads', label: 'Téléchargements' },
]

// Clés localStorage
export const STORAGE_KEYS = {
  token: 'osh_token',
  user: 'osh_user',
  draft: 'osh_draft',
  theme: 'osh_theme',
  chat: 'osh_chat',
}
