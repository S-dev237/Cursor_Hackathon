import {
  INITIAL_DOCUMENTS,
  MOCK_CITATIONS,
  MOCK_DOMAINS,
  MOCK_INSTITUTIONS,
  MOCK_SAMPLE_PDF_URL,
  MOCK_USERS,
  MOCK_USER_LIST,
  MOCK_AI_EXTRACTION,
} from './mockData.js'

/** État mutable en mémoire (session dev). */
let documents = structuredClone(INITIAL_DOCUMENTS)
let users = structuredClone(MOCK_USER_LIST)
let nextDocId = 100

export function isMockMode() {
  return import.meta.env.VITE_MOCK_API === 'true'
}

export function mockDelay(ms = 280) {
  return new Promise((r) => setTimeout(r, ms))
}

function enrich(doc) {
  const domain = MOCK_DOMAINS.find((d) => d.id === doc.domain_id)
  const institution = MOCK_INSTITUTIONS.find((i) => i.id === doc.institution_id)
  return {
    ...doc,
    domain_name: domain?.name || doc.domain_name || '',
    institution_name: institution?.name || doc.institution_name || '',
  }
}

function publishedDocs() {
  return documents.filter((d) => d.status === 'published')
}

function draftDocs() {
  return documents.filter((d) => d.status === 'draft')
}

function matchQuery(doc, q) {
  if (!q) return true
  const hay = [
    doc.title,
    doc.abstract,
    ...(doc.authors || []),
    ...(doc.keywords || []),
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q.toLowerCase())
}

// —— Auth ——
export async function mockLogin(email, password) {
  await mockDelay()
  const key = email.trim().toLowerCase()
  const user = MOCK_USERS[key]
  if (!user) {
    return { data: null, error: 'Identifiants invalides (mode démo : admin@openscience.cm ou demo@etudiant.cm)' }
  }
  if (!password) {
    return { data: null, error: 'Mot de passe requis' }
  }
  const token = user.role === 'admin' ? 'mock-token-admin' : 'mock-token-student'
  return {
    data: { access_token: token, token_type: 'bearer', user },
    error: null,
  }
}

export async function mockRegister(payload) {
  await mockDelay()
  const user = {
    id: `usr-${Date.now()}`,
    email: payload.email,
    full_name: payload.full_name,
    role: payload.role || 'student',
    institution_id: payload.institution_id || 'ins-2',
  }
  return {
    data: { access_token: 'mock-token-student', token_type: 'bearer', user },
    error: null,
  }
}

export async function mockGetMe() {
  await mockDelay(120)
  const raw = localStorage.getItem('osh_user')
  if (!raw) return { data: null, error: 'Non authentifié' }
  return { data: JSON.parse(raw), error: null }
}

// —— Documents ——
export async function mockSearchDocuments(params = {}) {
  await mockDelay()
  let list = publishedDocs()

  if (params.exclude_id) {
    list = list.filter((d) => String(d.id) !== String(params.exclude_id))
  }
  if (params.q) list = list.filter((d) => matchQuery(d, params.q))
  if (params.type?.length) list = list.filter((d) => params.type.includes(d.doc_type))
  if (params.domain_id) list = list.filter((d) => String(d.domain_id) === String(params.domain_id))
  if (params.institution_id) list = list.filter((d) => String(d.institution_id) === String(params.institution_id))
  if (params.year_from) list = list.filter((d) => d.publication_year >= Number(params.year_from))
  if (params.year_to) list = list.filter((d) => d.publication_year <= Number(params.year_to))
  if (params.ai_only === true || params.ai_only === 'true') {
    list = list.filter((d) => d.ai_extracted)
  }

  const sort = params.sort || 'relevance'
  if (sort === 'date') {
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } else if (sort === 'downloads') {
    list.sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
  }

  const page = Number(params.page) || 1
  const perPage = Number(params.per_page) || 12
  const total = list.length
  const start = (page - 1) * perPage
  const slice = list.slice(start, start + perPage)

  return {
    data: { documents: slice.map(enrich), total, page, per_page: perPage },
    error: null,
  }
}

export async function mockGetDocument(id) {
  await mockDelay()
  const doc = documents.find((d) => String(d.id) === String(id))
  if (!doc) {
    return { data: null, error: 'Document introuvable', status: 404 }
  }
  return { data: enrich(doc), error: null, status: 200 }
}

export async function mockGetMyDocuments() {
  await mockDelay()
  const raw = localStorage.getItem('osh_user')
  if (!raw) return { data: [], error: null }
  const user = JSON.parse(raw)
  const list = documents.filter((d) => d.submitter_email === user.email)
  return { data: list.map(enrich), error: null }
}

export async function mockSubmitDocument(_file, metadata = {}) {
  await mockDelay(400)
  const id = `doc-new-${nextDocId++}`
  const raw = localStorage.getItem('osh_user')
  const user = raw ? JSON.parse(raw) : { email: 'demo@etudiant.cm' }

  const doc = enrich({
    id,
    title: metadata.title || 'Nouvelle soumission (sans titre)',
    abstract: metadata.abstract || '',
    doc_type: metadata.doc_type || 'memoir',
    status: 'draft',
    authors: metadata.authors || [user.full_name],
    keywords: metadata.keywords || [],
    publication_year: metadata.publication_year || new Date().getFullYear(),
    domain_id: metadata.domain_id || 'dom-1',
    institution_id: metadata.institution_id || 'ins-2',
    ai_extracted: metadata.ai_extracted || false,
    ai_confidence: metadata.ai_confidence || 0,
    submitter_email: user.email,
    created_at: new Date().toISOString(),
    view_count: 0,
    download_count: 0,
    file_size_kb: 1024,
    page_count: 24,
  })

  documents.push(doc)
  return { data: doc, error: null }
}

export async function mockUpdateDocument(id, payload) {
  await mockDelay(300)
  const idx = documents.findIndex((d) => String(d.id) === String(id))
  if (idx === -1) return { data: null, error: 'Document introuvable' }
  documents[idx] = enrich({ ...documents[idx], ...payload })
  return { data: documents[idx], error: null }
}

export function mockGetDownloadUrl() {
  return MOCK_SAMPLE_PDF_URL
}

export async function mockGetCitation(_id, format = 'bibtex') {
  await mockDelay(200)
  return {
    data: { citation: MOCK_CITATIONS[format] || MOCK_CITATIONS.bibtex },
    error: null,
  }
}

export async function mockGetStats() {
  await mockDelay(150)
  const published = publishedDocs()
  return {
    data: {
      total_documents: published.length,
      total_users: users.length,
      total_institutions: MOCK_INSTITUTIONS.length,
      total_downloads: published.reduce((s, d) => s + (d.download_count || 0), 0),
      total_drafts: draftDocs().length,
    },
    error: null,
  }
}

export async function mockGetDomains() {
  await mockDelay(100)
  return { data: MOCK_DOMAINS, error: null }
}

export async function mockGetInstitutions() {
  await mockDelay(100)
  return { data: MOCK_INSTITUTIONS, error: null }
}

async function mockSetStatus(id, status, delay = 320) {
  await mockDelay(delay)
  const idx = documents.findIndex((d) => String(d.id) === String(id))
  if (idx === -1) return { data: null, error: 'Document introuvable' }
  documents[idx] = enrich({ ...documents[idx], status })
  return { data: documents[idx], error: null }
}

export function mockPublishDocument(id) {
  return mockSetStatus(id, 'published')
}

export function mockWithdrawDocument(id) {
  return mockSetStatus(id, 'withdrawn')
}

/** Liste admin de TOUS les documents, filtrable par statut. */
export async function mockGetAllDocuments(params = {}) {
  await mockDelay()
  let list = [...documents]
  if (params.status) list = list.filter((d) => d.status === params.status)
  if (params.q) list = list.filter((d) => matchQuery(d, params.q))
  list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return {
    data: { documents: list.map(enrich), total: list.length },
    error: null,
  }
}

// —— Utilisateurs (gestion admin en mémoire) ——
export async function mockGetUsers() {
  await mockDelay(180)
  const enriched = users.map((u) => ({
    ...u,
    institution_name:
      MOCK_INSTITUTIONS.find((i) => i.id === u.institution_id)?.name || '',
  }))
  return { data: { users: enriched, total: enriched.length }, error: null }
}

export async function mockSetUserRole(id, role) {
  await mockDelay(220)
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return { data: null, error: 'Utilisateur introuvable' }
  users[idx] = { ...users[idx], role }
  return { data: users[idx], error: null }
}

export async function mockSetUserActive(id, isActive) {
  await mockDelay(220)
  const idx = users.findIndex((u) => u.id === id)
  if (idx === -1) return { data: null, error: 'Utilisateur introuvable' }
  users[idx] = { ...users[idx], is_active: isActive }
  return { data: users[idx], error: null }
}

// —— Profil utilisateur courant ——
export async function mockUpdateMe(payload = {}) {
  await mockDelay(280)
  const raw = localStorage.getItem('osh_user')
  if (!raw) return { data: null, error: 'Non authentifié' }
  const current = JSON.parse(raw)
  const allowed = {}
  if (payload.full_name !== undefined) allowed.full_name = payload.full_name
  if (payload.institution_id !== undefined)
    allowed.institution_id = payload.institution_id
  const next = { ...current, ...allowed }
  localStorage.setItem('osh_user', JSON.stringify(next))

  // Garde la liste admin cohérente si l'utilisateur courant y figure
  const idx = users.findIndex((u) => u.id === next.id || u.email === next.email)
  if (idx !== -1) users[idx] = { ...users[idx], ...allowed }

  return { data: next, error: null }
}

export async function mockExtractMetadata() {
  await mockDelay(1500)
  return { data: { ...MOCK_AI_EXTRACTION }, error: null }
}

// —— Traduction (simulation, démo sans backend) ——
// Traductions FR→EN soignées pour les documents publiés (seed).
const MOCK_TRANSLATIONS_EN = {
  'doc-1': {
    title: 'Deep Learning applied to agricultural remote sensing in Cameroon',
    abstract:
      'This thesis explores the application of convolutional neural networks to crop classification from Sentinel-2 satellite imagery.',
    keywords: ['machine learning', 'remote sensing', 'agriculture'],
  },
  'doc-2': {
    title: 'Structural modeling of bridges in seismic zones',
    abstract:
      'Numerical analysis of bridge structures subjected to seismic loading in a tropical context.',
    keywords: ['civil engineering', 'seismic', 'simulation'],
  },
  'doc-3': {
    title: 'Epidemiology of neglected tropical diseases in Central Africa',
    abstract:
      'Systematic review and spatial analysis of epidemiological data on NTDs in the CEMAC region.',
    keywords: ['epidemiology', 'public health', 'Africa'],
  },
  'doc-4': {
    title: 'Impact of microfinance on the financial inclusion of SMEs',
    abstract:
      'Empirical study on credit access for small businesses in Cameroonian urban areas.',
    keywords: ['microfinance', 'SMEs', 'economics'],
  },
  'doc-5': {
    title: 'Energy optimization of tropical buildings',
    abstract:
      'Proposal of a thermal simulation model adapted to humid equatorial climates.',
    keywords: ['energy', 'building', 'sustainability'],
  },
  'doc-6': {
    title: 'Optical properties of two-dimensional nanomaterials',
    abstract:
      'Experimental characterization and theoretical modeling of the optical properties of 2D materials.',
    keywords: ['physics', 'nanomaterials', 'optics'],
  },
}

// Glossaire de repli pour les documents sans traduction soignée.
const FR_EN_GLOSSARY = {
  recommandation: 'recommendation',
  bibliothèque: 'library',
  droit: 'law',
  gouvernance: 'governance',
  transport: 'transport',
  algorithmes: 'algorithms',
  génétiques: 'genetic',
  optimisation: 'optimization',
  réseaux: 'networks',
  santé: 'health',
  économie: 'economics',
  énergie: 'energy',
  bâtiment: 'building',
  durabilité: 'sustainability',
  physique: 'physics',
  optique: 'optics',
  agriculture: 'agriculture',
  simulation: 'simulation',
  télédétection: 'remote sensing',
}

function glossaryTranslate(text = '') {
  return text.replace(/[A-Za-zÀ-ÿ]+/g, (word) => {
    const hit = FR_EN_GLOSSARY[word.toLowerCase()]
    if (!hit) return word
    return word[0] === word[0].toUpperCase()
      ? hit[0].toUpperCase() + hit.slice(1)
      : hit
  })
}

export async function mockTranslateDocument(id, targetLang = 'en') {
  await mockDelay(900)
  const document = documents.find((d) => String(d.id) === String(id))
  if (!document) return { data: null, error: 'Document introuvable' }

  // Le corpus de démo est en français : traduire vers 'fr' renvoie l'original.
  if (targetLang === 'fr') {
    return {
      data: {
        title: document.title,
        abstract: document.abstract,
        keywords: document.keywords || [],
        target_lang: 'fr',
        simulated: false,
      },
      error: null,
    }
  }

  const curated = MOCK_TRANSLATIONS_EN[id]
  if (curated) {
    return {
      data: { ...curated, target_lang: 'en', simulated: true },
      error: null,
    }
  }

  return {
    data: {
      title: glossaryTranslate(document.title),
      abstract: glossaryTranslate(document.abstract || ''),
      keywords: (document.keywords || []).map(glossaryTranslate),
      target_lang: 'en',
      simulated: true,
    },
    error: null,
  }
}

export function mockRegisterView(id) {
  const doc = documents.find((d) => String(d.id) === String(id))
  if (doc) doc.view_count = (doc.view_count || 0) + 1
}
