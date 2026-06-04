// Construction du contexte injecté à OpenScience AI.
// Le prompt système décrit la plateforme + le catalogue des documents publiés,
// de sorte que l'assistant puisse répondre sur le fonctionnement du site ET sur les travaux.

import { searchDocuments, getDomains, getInstitutions } from '../api/documents.js'
import { DOC_TYPE_LABELS } from '../constants/colors.js'

export const SUGGESTED_PROMPTS = [
  "C'est quoi OpenScience Hub ?",
  'Comment soumettre un mémoire ?',
  'Quels travaux parlent de machine learning ?',
  'Trouve-moi des documents en génie civil',
]

const PLATFORM_OVERVIEW = `OpenScience Hub est un répertoire institutionnel qui archive, classe et permet de consulter des travaux scientifiques universitaires : thèses, mémoires, articles et rapports.

Fonctionnalités principales :
- Recherche à facettes (mot-clé, type de document, domaine, institution, plage d'années, tri par pertinence/date/téléchargements).
- Consultation d'un document avec lecteur PDF intégré, métadonnées, statistiques et export de citations (BibTeX, APA, MLA).
- Soumission d'un travail via un assistant en 4 étapes : lors du téléversement du PDF, une IA extrait automatiquement les métadonnées (titre, auteurs, mots-clés, résumé) et suggère un domaine ; l'auteur vérifie puis publie.
- Auto-publication par l'auteur : un document passe par les statuts brouillon → publié → retiré (pas de modération externe).
- Espace « Mes soumissions » pour gérer ses documents, page « Profil », et un tableau de bord pour les administrateurs.

Pages et liens utiles (utilise ces chemins pour proposer des liens) :
- Accueil : /
- Recherche : /search (paramètres : q, type, domain_id, institution_id, year_from, year_to, sort)
- Domaines : /domains — Institutions : /institutions
- Détail d'un document : /documents/{id}
- Soumettre : /submit — Mes soumissions : /my-submissions — Connexion : /login`

function truncate(str, n) {
  if (!str) return ''
  const s = String(str).replace(/\s+/g, ' ').trim()
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function formatDoc(doc) {
  const type = DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type || 'Document'
  const authors = (doc.authors || []).join(', ') || 'Auteur inconnu'
  const keywords = (doc.keywords || []).join(', ')
  const parts = [
    `- [${doc.title}](/documents/${doc.id}) — ${type}, ${doc.publication_year || '?'}`,
    doc.domain_name ? `, ${doc.domain_name}` : '',
    doc.institution_name ? `, ${doc.institution_name}` : '',
    `. Auteurs : ${authors}.`,
    keywords ? ` Mots-clés : ${keywords}.` : '',
    doc.abstract ? ` Résumé : ${truncate(doc.abstract, 240)}` : '',
  ]
  return parts.join('')
}

const RULES = `Règles de réponse :
- Tu es « OpenScience AI », l'assistant officiel de la plateforme. Réponds toujours en français, sur un ton clair, chaleureux et concis.
- Mets en forme tes réponses en Markdown léger (gras, listes, liens).
- Quand tu cites un document, utilise un lien Markdown vers sa fiche : [Titre exact](/documents/ID).
- Pour orienter vers une recherche, propose un lien comme [voir les résultats](/search?q=...).
- Base-toi UNIQUEMENT sur le catalogue et les informations ci-dessus. N'invente jamais de document, d'auteur, de chiffre ou de fonctionnalité.
- Si l'information demandée n'est pas disponible, dis-le honnêtement et propose une recherche ou une action sur la plateforme.
- Reste sur le thème (la plateforme et les travaux scientifiques) ; décline poliment les sujets hors de ce périmètre.`

/**
 * Construit le prompt système complet. Robuste : si le catalogue est indisponible,
 * renvoie au moins la description de la plateforme.
 * @returns {Promise<string>}
 */
export async function buildSystemPrompt() {
  let catalog = ''
  let taxonomy = ''

  try {
    const [docsRes, domainsRes, institutionsRes] = await Promise.all([
      searchDocuments({ per_page: 100, sort: 'relevance' }),
      getDomains(),
      getInstitutions(),
    ])

    const docs = docsRes?.data?.documents || []
    const domains = domainsRes?.data || []
    const institutions = institutionsRes?.data || []

    if (docs.length) {
      catalog =
        `\n\nCatalogue des documents publiés (${docs.length}) :\n` +
        docs.map(formatDoc).join('\n')
    }

    const domainNames = domains.map((d) => d.name).filter(Boolean)
    const institutionNames = institutions
      .map((i) => (i.acronym ? `${i.name} (${i.acronym})` : i.name))
      .filter(Boolean)

    if (domainNames.length || institutionNames.length) {
      taxonomy =
        `\n\nDomaines disponibles : ${domainNames.join(', ')}.` +
        `\nInstitutions : ${institutionNames.join(', ')}.`
    }
  } catch {
    /* le catalogue restera vide → l'assistant pourra quand même parler de la plateforme */
  }

  return `${PLATFORM_OVERVIEW}${taxonomy}${catalog}\n\n${RULES}`
}
