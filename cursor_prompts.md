# OpenScience Hub — Prompts Cursor
**Hackathon J.U.I.N 2026 · Frontend React**

> Ordre d'exécution : P0 → P1 → P2 → P3 → P4 → P5 → P6
> Chaque prompt est conçu pour Cursor **Composer (Cmd+I)** sauf P0 qui utilise le **Mode Plan (Shift+Tab)**.

---

## P0 — Scaffold & Architecture (Mode Plan)
> **Outil Cursor : Shift+Tab → Mode Plan**
> Durée estimée : 20 min

```
Je démarre un projet React pour un hackathon de 7h. Voici l'architecture cible.

PROJET : OpenScience Hub — répertoire de travaux académiques universitaires
STACK : React 18 + Vite + React Router v6 + Tailwind CSS + Axios

STRUCTURE DE FICHIERS à générer :
src/
├── api/
│   ├── axios.js          # instance Axios avec baseURL + intercepteur JWT
│   ├── auth.js           # fonctions login, register, refreshToken, getMe
│   ├── documents.js      # search, getById, submit, download, view
│   └── ai.js             # extractMetadata(documentId)
├── contexts/
│   └── AuthContext.jsx   # user, token, login(), logout(), isAdmin
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   └── PrivateRoute.jsx
│   ├── ui/
│   │   ├── DocumentCard.jsx
│   │   ├── TypeBadge.jsx
│   │   ├── AiBadge.jsx
│   │   └── Pagination.jsx
│   └── search/
│       ├── SearchBar.jsx
│       └── FilterSidebar.jsx
├── pages/
│   ├── LandingPage.jsx
│   ├── SearchPage.jsx
│   ├── DocumentPage.jsx
│   ├── SubmitPage.jsx
│   ├── LoginPage.jsx
│   ├── RegisterPage.jsx
│   └── admin/
│       └── AdminQueue.jsx
├── hooks/
│   ├── useSearch.js      # logique recherche + filtres + URL params
│   └── useAuth.js        # wrapper useContext(AuthContext)
└── constants/
    └── colors.js         # palette design tokens

BACKEND (FastAPI, port 8000) — contrats API à respecter :
- POST   /auth/login          → { access_token, token_type, user }
- POST   /auth/register       → { access_token, token_type, user }
- GET    /auth/me             → { id, email, full_name, role }
- GET    /search?q=&type=&domain_id=&year_from=&year_to=&sort=&page=&per_page=
         → { documents: Document[], total, page, per_page }
- GET    /documents/{id}      → Document (complet)
- GET    /documents/{id}/download → redirect vers le fichier PDF
- POST   /documents/          → multipart/form-data upload
- POST   /ai/extract-metadata → { title, authors, abstract, keywords, domain_suggestion, confidence }
- GET    /stats               → { total_documents, total_users, total_institutions, total_downloads }
- GET    /domains             → Domain[]
- GET    /institutions        → Institution[]
- PATCH  /admin/documents/{id}/review → { status: approved|rejected, rejection_reason? }

TYPE Document :
{
  id, title, abstract, doc_type: 'thesis'|'memoir'|'article'|'report',
  authors: string[], keywords: string[], publication_year: number,
  domain_name, institution_name, file_size_kb, page_count,
  view_count, download_count, ai_extracted: boolean, ai_confidence: number,
  status: 'pending'|'approved'|'rejected', created_at
}

PALETTE DESIGN (Tailwind config custom) :
navy: { DEFAULT: '#0B1929', mid: '#132337' }
teal: { DEFAULT: '#1D9E75', light: '#E1F5EE', mid: '#5DCAA5', dark: '#0F6E56' }
gray: { bg: '#F4F3EF', border: '#D3D1C7', muted: '#888780', text: '#2C2C2A' }

FONTS (Google Fonts) :
- Crimson Pro : titres de documents (serif, academique)
- DM Sans     : interface (corps, labels, boutons)
- DM Mono     : codes, badges, métadonnées techniques

RÈGLES IMPORTANTES :
1. L'instance Axios doit automatiquement ajouter Authorization: Bearer {token} depuis localStorage
2. Les routes /submit, /documents/my, /admin/* sont protégées (PrivateRoute)
3. /admin/* est accessible uniquement si user.role === 'admin'
4. Le token JWT expire en 30 min — prévoir un intercepteur de réponse pour catch 401
5. Toutes les requêtes search synchronisent les filtres dans les URL params (useSearchParams)

Génère la structure complète avec les fichiers vides balisés et installe les dépendances.
Installe : react-router-dom axios react-pdf @tailwindcss/forms
```

---

## P1 — AuthContext + Routing + Axios
> **Outil Cursor : Composer (Cmd+I)**
> Durée estimée : 25 min

```
Implémente l'authentification complète pour OpenScience Hub.

FICHIERS À CRÉER/MODIFIER : src/api/axios.js, src/contexts/AuthContext.jsx,
src/hooks/useAuth.js, src/components/layout/PrivateRoute.jsx, src/App.jsx (routes)

━━ src/api/axios.js ━━
- Instance Axios baseURL = import.meta.env.VITE_API_URL (défaut http://localhost:8000)
- Intercepteur REQUEST : ajoute Authorization: Bearer {token} si token dans localStorage
- Intercepteur RESPONSE : si 401 → supprime token + redirige vers /login

━━ src/contexts/AuthContext.jsx ━━
State : { user, token, loading }
- login(email, password) : POST /auth/login → stocke token dans localStorage + state
- register(data) : POST /auth/register → même logique
- logout() : supprime localStorage, reset state, redirige /
- isAdmin : computed = user?.role === 'admin'
- Au montage : si token en localStorage, GET /auth/me pour rehydrater user
- Expose via AuthContext.Provider

━━ src/components/layout/PrivateRoute.jsx ━━
- Si loading → spinner centré
- Si !user → <Navigate to="/login" />
- Si adminOnly && !isAdmin → <Navigate to="/" />
- Sinon → <Outlet />

━━ src/App.jsx — Routes ━━
Routes publiques : / (LandingPage), /search (SearchPage), /documents/:id,
  /login (LoginPage), /register (RegisterPage)
Routes privées (PrivateRoute) : /submit (SubmitPage), /my-submissions
Routes admin (PrivateRoute adminOnly) : /admin, /admin/queue

━━ PAGES PLACEHOLDER ━━
Crée des composants vides avec juste le titre pour LoginPage, RegisterPage,
LandingPage, SearchPage, DocumentPage, SubmitPage afin que les routes fonctionnent.

━━ IMPORTANT ━━
Utilise uniquement fetch natif ou axios (déjà installé). Pas de react-query pour
l'instant. Les fonctions async doivent avoir try/catch et retourner { data, error }.
```

---

## P2 — Landing Page
> **Outil Cursor : Composer (Cmd+I)**
> Durée estimée : 30 min

```
Crée la LandingPage complète de OpenScience Hub dans src/pages/LandingPage.jsx.

DESIGN : Dark navy (#0B1929) pour la navbar et le hero. Fond gris clair (#F4F3EF)
pour le reste. Accent teal (#1D9E75). Serif "Crimson Pro" pour les gros titres.

━━ SECTION 1 : NAVBAR ━━
- Logo : carré teal avec icône école + "OpenScience Hub" (Crimson Pro)
- Liens : Explorer, Institutions, Domaines
- Boutons : Connexion (ghost) + Soumettre (teal)
- Si user connecté : remplace Connexion par avatar initiales + prénom

━━ SECTION 2 : HERO ━━
Fond dark navy, texte blanc.
- Badge animé : "✦ Extraction IA des métadonnées disponible"
- H1 (Crimson Pro 38px italic+bold) : "Le répertoire ouvert des travaux scientifiques universitaires"
- Sous-titre gris clair
- Barre de recherche avec icône, placeholder, bouton teal
  → onSubmit : navigate('/search?q=' + encodeURIComponent(query))
- Tags tendances cliquables : ["machine learning", "réseaux de neurones", "génie logiciel", "énergie renouvelable"]
  → onClick : navigate('/search?q=' + tag)
- Stats row (4 colonnes) : données dynamiques depuis GET /stats
  Fallback si loading : affiche "—"

━━ SECTION 3 : DERNIÈRES PUBLICATIONS ━━
Fond gris clair. Titre "Récemment ajoutés" + lien "Voir tout →" → /search
Grille 3 colonnes de DocumentCard.
Données : GET /search?sort=date&per_page=6&status=approved
Chaque DocumentCard : TypeBadge, AiBadge si ai_extracted, titre (Crimson Pro),
auteur + institution, tags mots-clés (3 max), stats vues/downloads, bouton Consulter.

━━ SECTION 4 : FONCTIONNALITÉS ━━
3 cards : "Recherche à facettes", "Extraction IA" (highlighted, badge "+3pts"),
"Export citations". Icônes Heroicons ou SVG simples.

━━ SECTION 5 : CTA CENTRAL ━━
Titre Crimson Pro + 2 boutons : "Soumettre un travail" (teal) + "Explorer les archives" (ghost)

━━ SECTION 6 : FOOTER ━━
Fond dark navy. Logo + description. Liens plateforme + ressources. Copyright.

━━ COMPOSANT DocumentCard (src/components/ui/DocumentCard.jsx) ━━
Props : document (type Document)
- TypeBadge coloré selon doc_type (thesis=purple, memoir=blue, article=teal, report=amber)
- AiBadge (sparkle icon + "IA") si ai_extracted
- Titre Crimson Pro tronqué à 2 lignes
- Auteur principal + institution
- Keywords (3 premiers comme tags gris)
- Stats : vues + downloads
- Bouton "Consulter" → navigate('/documents/' + id)

━━ COMPORTEMENT SCROLL ━━
Navbar sticky en top. Smooth scroll entre sections si hash links.
```

---

## P3 — Page de Recherche (SearchPage)
> **Outil Cursor : Composer (Cmd+I)**
> Durée estimée : 35 min

```
Crée src/pages/SearchPage.jsx + src/hooks/useSearch.js + src/components/search/FilterSidebar.jsx

━━ LAYOUT ━━
Topbar (Navbar réutilisée) + Layout 2 colonnes : sidebar 220px | grille résultats flex-1.
Fond #F4F3EF. Cards résultats sur fond blanc.

━━ HOOK useSearch.js ━━
Synchronise les filtres avec les URL searchParams (useSearchParams de react-router-dom).
State local : { q, type[], domain_id, institution_id, year_from, year_to, sort, ai_only, page }
- Toute modification d'un filtre → setSearchParams() → déclenche fetch
- fetchResults() : GET /search avec tous les params actifs → { documents, total, page, per_page }
- Debounce 300ms sur le champ q uniquement
- Retourne : { results, total, loading, filters, setFilter, resetFilters }

━━ FilterSidebar ━━
Sections :
1. Filtres actifs : chips suppressibles (si filtre actif → affiche chip coloré + bouton X)
2. Type de travail : checkboxes thesis/memoir/article/report avec compteurs
3. Domaine : checkboxes depuis GET /domains (max 5 affichés + "N autres")
4. Institution : checkboxes depuis GET /institutions (max 4)
5. Année : range slider double (year_from / year_to), range 2015–2025
6. Toggle "Avec IA extractée" uniquement

━━ Zone résultats ━━
Header : "247 résultats pour 'machine learning'" + sélecteur tri (Pertinence | Date | Téléchargements)
Liste de DocumentCardDetailed (version étendue) :
- Tout ce que DocumentCard affiche + abstract tronqué 2 lignes
- Badge IA si ai_extracted
- Bouton "Consulter" → /documents/:id
- onClick sur la card → navigate aussi

EmptyState si total === 0 : illustration, message, suggestions de recherche.

Pagination : boutons numérotés, max 7 visibles, ... pour ellipse. Scroll to top au changement.

━━ SearchBar (src/components/search/SearchBar.jsx) ━━
Réutilisable depuis Landing + Search. Props : initialValue, onSearch, size ('lg' | 'sm').
- Affiche l'icône loupe, input contrôlé, bouton Rechercher.
- onKeyDown Enter → onSearch(value)
- size='lg' : version hero de la landing (fond semi-transparent sur navy)
- size='sm' : version topbar de l'app (fond sombre compact)

━━ IMPORTANT ━━
Les URL params doivent être partageables. Ex : /search?q=IA&type=thesis&year_from=2022
doit restaurer exactement l'état des filtres au chargement de la page.
```

---

## P4 — Page Détail Document (DocumentPage)
> **Outil Cursor : Composer (Cmd+I)**
> Durée estimée : 30 min

```
Crée src/pages/DocumentPage.jsx pour afficher le détail complet d'un document approuvé.

ROUTE : /documents/:id

━━ LAYOUT ━━
Topbar (Navbar) + Layout 2 colonnes : PDF viewer flex-1 | Panel métadonnées 260px.

━━ FETCH ━━
Au montage : GET /documents/:id → si 404 → page "Document introuvable"
+ POST /documents/:id/view (fire & forget, pas de gestion d'erreur)

━━ PANNEAU GAUCHE : PDF VIEWER ━━
Utilise react-pdf (déjà installé). Import : import { Document, Page } from 'react-pdf'
- Toolbar : flèches prev/next page, "Page X / N", zoom +/- (75%/100%/125%), bouton download
- Téléchargement → GET /documents/:id/download → window.open(url)
- Fond sombre (#2C2C2A) autour du PDF blanc
- Si PDF en chargement : skeleton animé

Intégration react-pdf :
  import { pdfjs } from 'react-pdf'
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js', import.meta.url
  ).toString()

━━ PANNEAU DROIT : MÉTADONNÉES ━━
En haut : TypeBadge + AiBadge si ai_extracted (avec score de confiance)
H2 Crimson Pro : titre du document
Rows métadonnées : auteurs, institution, année, domaine, volume (pages + Mo)
Stats : vues + téléchargements

2 boutons : Télécharger (teal) | Partager (copie URL dans clipboard + toast)

Divider + Section "Mots-clés" : tags gris
Divider + Section "Exporter la citation" :
  Tabs : BibTeX | APA | MLA
  Affiche le texte de citation formaté dans une box monospace
  Bouton "Copier" → navigator.clipboard + toast "Copié !"
  Données depuis GET /documents/:id/citation?format=bibtex (ou apa, mla)

Divider + Section "Travaux similaires" :
  GET /search?domain_id={doc.domain_id}&per_page=3&exclude_id={doc.id}
  Affiche 3 mini-cards avec titre tronqué + auteur + année

━━ TOAST ━━
Crée src/components/ui/Toast.jsx : composant simple position fixed bottom-right,
auto-dismiss 3s, variants success/error.

━━ BREADCRUMB ━━
En topbar : OSHub > Recherche > [titre tronqué 40 chars]
Clic "Recherche" → navigate(-1) si history disponible sinon /search
```

---

## P5 — Formulaire de Soumission (SubmitPage)
> **Outil Cursor : Composer (Cmd+I)**
> Durée estimée : 35 min

```
Crée src/pages/SubmitPage.jsx — formulaire multi-étapes pour soumettre un travail.

ROUTE : /submit (PrivateRoute — connecté uniquement)

━━ ÉTAT GLOBAL DU FORMULAIRE ━━
Utilise useReducer ou useState avec un objet formData :
{
  title, doc_type, publication_year, institution_id, domain_id,
  authors: string[], keywords: string[], abstract,
  file: File | null, ai_extracted: boolean, ai_confidence: number
}
+ currentStep (1-4) + isDraft: true (auto-save localStorage toutes les 30s)

━━ LAYOUT ━━
Sidebar gauche 220px (stepper) | Zone formulaire principale.

━━ SIDEBAR STEPPER ━━
4 étapes visuelles : Informations générales / Auteurs & domaine / Document & IA / Confirmation
Étapes passées : icône check vert. Étape active : cercle teal. Étapes futures : grisées.
Barre de progression linéaire en haut du formulaire principal (25% / 50% / 75% / 100%).
Encart "Brouillon sauvegardé" avec timestamp.

━━ ÉTAPE 1 : Informations générales ━━
- Titre (input text, requis)
- Type de travail (select : Thèse / Mémoire / Article / Rapport)
- Année de publication (select 2010–2026)
- Institution (select dynamique depuis GET /institutions)
Validation : tous requis avant de passer à l'étape 2.

━━ ÉTAPE 2 : Auteurs & Domaine ━━
- Auteurs (tags input custom) :
  input text + Enter ou virgule → ajoute un tag chip vert supprimable.
  Min 1 auteur requis.
- Domaine (select depuis GET /domains)
- Mots-clés (tags input identique, max 10 tags)
Validation : min 1 auteur, domaine sélectionné.

━━ ÉTAPE 3 : Document & IA ━━
UPLOAD :
Zone drag & drop. onDrop / onChange → valide : extension .pdf uniquement, taille ≤ 20Mo.
Si fichier valide : affiche nom + taille + page count simulé + badge "PDF natif".

BOUTON EXTRACTION IA :
Affiché uniquement si file !== null.
Style : fond dark navy, icône sparkle teal, texte "Extraire les métadonnées avec l'IA".
onClick :
  1. POST /documents/ avec juste le fichier (sans metadata) → reçoit document.id temporaire
  2. POST /ai/extract-metadata { document_id } → reçoit { title, authors, abstract, keywords, domain_suggestion, confidence }
  3. Pre-fills formData avec les données reçues
  4. Affiche banner vert "Extraction réussie — confiance XX%" avec badge score
  5. Chaque champ pré-rempli reçoit un badge "IA" et un style vert clair (border teal + bg #F0FAF6)
Si erreur API : banner orange "Extraction partielle — remplissez les champs manuellement"

Affiche les champs pré-remplis : Titre, Année, Domaine, Mots-clés (tags), Résumé (textarea).
Tous restent éditables.

━━ ÉTAPE 4 : Confirmation ━━
Récapitulatif read-only de toutes les informations saisies.
Bouton "Soumettre" → POST /documents/ multipart avec toutes les métadonnées + fichier
→ Succès : navigate('/my-submissions') + toast "Soumission envoyée — en attente de validation"
→ Erreur : toast rouge avec message d'erreur.

━━ NAVIGATION ━━
Boutons Précédent / Suivant. Validation à chaque étape avant d'avancer.
Ctrl+S sauvegarde manuellement le brouillon.
```

---

## P6 — Panel Admin (AdminQueue)
> **Outil Cursor : Composer (Cmd+I)**
> Durée estimée : 25 min

```
Crée src/pages/admin/AdminQueue.jsx — panel de validation des soumissions.

ROUTE : /admin/queue (PrivateRoute adminOnly)

━━ LAYOUT ━━
Topbar avec badge "ADMIN" rouge + avatar. Sidebar gauche 190px + zone principale.

━━ SIDEBAR ━━
Navigation : Dashboard, File d'attente (badge rouge avec count), Approuvés, Rejetés,
Utilisateurs, Domaines, Institutions.
Encart alerte si pending > 0 : "X en attente · La plus ancienne date de N jours"

━━ STATS ROW ━━
4 metric cards : En attente (amber) | Approuvés (vert) | Rejetés (rouge) | Taux validation %
Données depuis GET /admin/stats ou calculées depuis les listes.

━━ FILE DE VALIDATION ━━
Fetch : GET /documents/?status=pending&sort=created_at&order=asc
Header : "X soumissions en attente" + sélecteur tri (Plus ancienne / Plus récente)

Chaque SubmissionCard :
- Badge statut (pending amber) + badge IA si ai_extracted
- Titre Crimson Pro
- Métadonnées : auteur, institution, année, taille fichier
- Résumé tronqué (si disponible)
- Alerte spéciale si PDF scanné (pas de ai_extracted) : fond amber, warning "PDF scanné détecté"

ACTIONS sur chaque card :
- Bouton "Approuver" (vert) → PATCH /admin/documents/:id/review { status: 'approved' }
  → retire la card de la liste + toast "Approuvé"
- Bouton "Rejeter" (rouge) → affiche inline un textarea pour le motif de rejet
  → PATCH /admin/documents/:id/review { status: 'rejected', rejection_reason }
  → retire la card + toast "Rejeté"
- Bouton "Voir PDF" → ouvre /documents/:id dans nouvel onglet

━━ OPTIMISTIC UI ━━
Retire immédiatement la card de la liste au clic Approuver/Rejeter (optimistic update).
Si l'API retourne une erreur → remet la card + toast rouge.

━━ PAGINATION ━━
Affiche 5 cards par page si > 5 soumissions. Lien "Voir N autres →" en bas.

━━ ÉTAT VIDE ━━
Si 0 soumissions pending : illustration minimaliste + "Aucune soumission en attente.
La file est vide." + bouton "Voir les approuvés →"
```

---

## Notes d'utilisation Cursor

### Mode Plan (P0)
Shift+Tab avant de coller le prompt. Cursor générera un plan step-by-step.
Approuve chaque étape avant execution.

### Mode YOLO (tous les prompts)
Active dans Paramètres > Beta avant de lancer P3–P6.
Il corrige les erreurs TypeScript/ESLint automatiquement.

### Variables d'environnement
Créer `.env.local` à la racine :
```
VITE_API_URL=http://localhost:8000
VITE_CLAUDE_API_URL=https://api.anthropic.com
```

### Ordre de développement conseillé (7h)
- H0:00 → P0 (scaffold) + P1 (auth)
- H1:30 → P2 (landing) en parallèle avec backend Phase 2
- H3:00 → P3 (search) en parallèle avec backend Phase 3
- H4:30 → P4 (détail) + début P5 (submit)
- H5:30 → P5 complet (extraction IA)
- H6:15 → P6 (admin) + polish
```
