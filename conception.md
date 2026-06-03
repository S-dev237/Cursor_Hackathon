# OpenScience Hub — Conception détaillée

> Hackathon J.U.I.N 2026 — Édition Cursor — Thème 2
> Stack : **FastAPI (Python) + PostgreSQL + OpenSearch + Next.js**
> Cible : MVP livrable en 24 h, qualité « production-grade demo »

---

## 0. Pitch en une phrase

**OpenScience Hub** est un répertoire institutionnel moderne qui transforme un dépôt PDF brut en une fiche scientifique structurée (auteurs, abstract, mots-clés, thématiques, citation, DOI) **en quelques secondes** grâce à un pipeline IA, et qui rend ces travaux trouvables via une recherche **hybride à facettes** (mot-clé + sémantique) — interopérable avec l'écosystème scientifique mondial (Dublin Core, OAI-PMH, DataCite, ORCID).

C'est un **DSpace nouvelle génération**, repensé autour de l'IA et des standards FAIR.

---

## 1. État de l'art — Ce qu'on copie aux grands

| Plateforme | Forces à reprendre | Limites qu'on dépasse |
|---|---|---|
| **DSpace 7/8** (LYRASIS, Duraspace) — leader mondial, ~3000 dépôts | Modèle Community → Collection → Item → Bitstream ; workflow de soumission/validation ; OAI-PMH ; SWORD ; conservation à long terme | UI Angular vieillissante, pas d'IA native, lourd à déployer |
| **InvenioRDM** (CERN, Zenodo) — moderne, Python/Flask | Excellents standards FAIR, DOI DataCite intégré, versioning, communautés, REST API propre, OAI-PMH/CRIS | Stack Flask/RabbitMQ/Invenio complexe, courbe d'apprentissage forte |
| **EPrints** (Southampton) | Pionnier OAI-PMH, simple, robuste | Perl, UI datée, écosystème en déclin |
| **Samvera / Hyrax** (Ruby) | Très modulaire, excellent pour collections patrimoniales | Trop générique pour un IR scientifique pur |
| **Islandora** | Bonne intégration Drupal | Surdimensionné pour notre besoin |
| **Omeka-S** | Très bon pour expositions/collections | Pas conçu pour la recherche scientifique |

**Décision** : on s'inspire du **modèle de données DSpace** (hiérarchie Community/Collection/Item/Bitstream, qui parle à tous les bibliothécaires) + du **modèle de métadonnées InvenioRDM** (proche DataCite, FAIR, versioning) + des **workflows OpenAIRE** (qualité métadonnées) — mais on réécrit from scratch en FastAPI moderne avec une **couche IA native** que personne n'a.

Sources : [DSpace](https://dspace.lyrasis.org/), [InvenioRDM](https://inveniordm.docs.cern.ch/), [UBC comparison study](https://open.library.ubc.ca/media/stream/pdf/42591/1.0075768/1), [SIS Wiki IR platforms](https://wiki-slis.apps.wayne.edu/index/Institutional_Repository_Platforms.html).

---

## 2. Standards à respecter (crédibilité jury)

| Standard | Priorité MVP | Pourquoi |
|---|---|---|
| **Dublin Core (DCMI Terms)** — 15 éléments core | **MUST** | Lingua franca des dépôts, requis par OAI-PMH. Stockés en table `dc_metadata(item_id, qualifier, value, lang)`. |
| **OAI-PMH 2.0** | **MUST** (3 endpoints) | `Identify`, `ListRecords`, `GetRecord` — c'est ce qui fait dire au jury : « ils ont compris la recherche scientifique ». Permet à Google Scholar / OpenAIRE de moissonner. |
| **DataCite Metadata Schema 4.5** | **SHOULD** (mapping export) | Permet l'attribution de DOI. On expose un endpoint `/items/{id}/datacite.xml`. |
| **ORCID** | **SHOULD** (champ auteur) | Identifiant chercheur unique. Un champ `orcid` sur `Author` suffit pour le MVP. |
| **DOI** | **COULD** (génération mock) | Pour la démo : on génère un identifiant style `10.HACK/openscience.{uuid}` et on l'affiche partout. |
| **schema.org/ScholarlyArticle** (JSON-LD) | **MUST** | Injecté dans `<head>` de chaque fiche → SEO + Google Scholar indexation. 10 lignes de code, énorme effet jury. |
| **FAIR principles** | **MUST** (discours) | Findable (search+DOI), Accessible (REST+OAI), Interoperable (DC/DataCite), Reusable (licence Creative Commons obligatoire). |
| **OpenAIRE Guidelines for Literature Repositories v4** | **NICE** | Profil applicatif sur Dublin Core. À mentionner dans le pitch. |
| **COAR Resource Types** vocabulaire | **SHOULD** | Vocabulaire contrôlé pour `dc.type` (`thesis`, `article`, `master thesis`, `report`). |
| **CC licenses** (CC-BY, CC-BY-NC, CC0) | **MUST** | Champ obligatoire à la soumission. |

> **Argument massue pour le jury** : « Notre dépôt est moissonnable par OpenAIRE et Google Scholar **dès la mise en ligne**, parce qu'on respecte Dublin Core via OAI-PMH et schema.org/ScholarlyArticle. »

Sources : [Dublin Core DCMI](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/), [DataCite Schema 4.5](https://schema.datacite.org/), [DataCite OAI-PMH Guide](https://support.datacite.org/docs/datacite-oai-pmh), [OpenAIRE Guidelines](https://guidelines.openaire.eu/), [InvenioRDM OAI-PMH ref](https://inveniordm.docs.cern.ch/reference/oai_pmh/).

---

## 3. Modèle de données

### 3.1 Diagramme conceptuel

```
Community 1───* Collection 1───* Item *───* Author
                                  │
                                  ├───* Bitstream (= File)
                                  ├───* Metadata (DC, k/v)
                                  ├───1 License
                                  ├───0..1 Embargo
                                  ├───* Version
                                  ├───* Topic (taxonomy)
                                  └───0..* Review
```

### 3.2 Tables PostgreSQL (DDL essentiel)

```sql
-- Hiérarchie organisationnelle (DSpace-like)
CREATE TABLE community (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                -- "Faculté des Sciences"
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES community(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE collection (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES community(id),
  name TEXT NOT NULL,                -- "Thèses de doctorat - Informatique"
  slug TEXT NOT NULL,
  type TEXT,                          -- 'thesis' | 'article' | 'memoir' | 'report'
  UNIQUE(community_id, slug)
);

-- L'œuvre scientifique
CREATE TABLE item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES collection(id),
  handle TEXT UNIQUE,                 -- "openscience/2026/0042"
  doi TEXT UNIQUE,                    -- "10.HACK/openscience.0042"
  title TEXT NOT NULL,
  subtitle TEXT,
  abstract TEXT,
  language CHAR(2) DEFAULT 'fr',      -- ISO 639-1
  resource_type TEXT,                 -- COAR vocabulary: 'thesis','article','master thesis'
  publication_year INT,
  publication_date DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft|submitted|under_review|approved|published|rejected|withdrawn
  license_id INT REFERENCES license(id),
  embargo_until DATE,                 -- NULL = pas d'embargo
  submitter_id UUID REFERENCES app_user(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  -- métadonnées IA pour audit
  ai_extracted_at TIMESTAMPTZ,
  ai_confidence NUMERIC(3,2)
);
CREATE INDEX item_status_idx ON item(status);
CREATE INDEX item_collection_idx ON item(collection_id);

-- Auteurs (peuvent être réutilisés)
CREATE TABLE author (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name TEXT NOT NULL,
  given_name TEXT NOT NULL,
  orcid TEXT UNIQUE,                  -- "0000-0002-1825-0097"
  affiliation TEXT,
  email TEXT
);

CREATE TABLE item_author (
  item_id UUID REFERENCES item(id) ON DELETE CASCADE,
  author_id UUID REFERENCES author(id),
  position INT NOT NULL,              -- ordre
  role TEXT DEFAULT 'author',         -- 'author','advisor','editor'
  PRIMARY KEY (item_id, author_id, role)
);

-- Métadonnées Dublin Core qualifiées (clé/valeur extensible)
CREATE TABLE dc_metadata (
  id BIGSERIAL PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES item(id) ON DELETE CASCADE,
  schema TEXT DEFAULT 'dc',           -- 'dc','dcterms','custom'
  element TEXT NOT NULL,              -- 'subject','contributor','identifier'
  qualifier TEXT,                     -- 'advisor','keyword','isbn'
  value TEXT NOT NULL,
  language CHAR(2)
);
CREATE INDEX dc_meta_item_idx ON dc_metadata(item_id);
CREATE INDEX dc_meta_lookup_idx ON dc_metadata(element, qualifier);

-- Fichiers (DSpace appelle ça "Bitstream")
CREATE TABLE bitstream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES item(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  checksum_sha256 TEXT,
  storage_key TEXT NOT NULL,          -- chemin MinIO/S3
  is_primary BOOLEAN DEFAULT false,
  ocr_done BOOLEAN DEFAULT false,
  full_text TEXT                      -- pour BM25 si on n'utilise pas OpenSearch côté texte
);

-- Licences (table de référence)
CREATE TABLE license (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,          -- 'CC-BY-4.0','CC0','CC-BY-NC-SA-4.0','custom'
  name TEXT NOT NULL,
  url TEXT
);

-- Versions
CREATE TABLE item_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES item(id),
  version_number INT NOT NULL,
  bitstream_id UUID REFERENCES bitstream(id),
  changelog TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Taxonomie (classification thématique IA + manuelle)
CREATE TABLE topic (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,          -- 'cs.AI','math.PR' (style arXiv) ou ACM CCS
  label_fr TEXT NOT NULL,
  label_en TEXT,
  parent_id INT REFERENCES topic(id)
);
CREATE TABLE item_topic (
  item_id UUID REFERENCES item(id) ON DELETE CASCADE,
  topic_id INT REFERENCES topic(id),
  score NUMERIC(3,2),                 -- score de confiance IA
  source TEXT DEFAULT 'ai',           -- 'ai','manual','validated'
  PRIMARY KEY (item_id, topic_id)
);

-- Workflow de revue
CREATE TABLE review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES item(id),
  reviewer_id UUID NOT NULL REFERENCES app_user(id),
  decision TEXT,                      -- 'approve','reject','request_changes'
  comment TEXT,
  decided_at TIMESTAMPTZ
);

-- Utilisateurs et rôles
CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,                 -- bcrypt
  full_name TEXT,
  orcid TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE role (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL           -- 'visitor','author','librarian','admin'
);
CREATE TABLE user_role (
  user_id UUID REFERENCES app_user(id),
  role_id INT REFERENCES role(id),
  PRIMARY KEY (user_id, role_id)
);

-- Audit
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ DEFAULT now(),
  user_id UUID,
  action TEXT NOT NULL,               -- 'item.submit','item.approve','file.download'
  entity_type TEXT,
  entity_id TEXT,
  details JSONB
);

-- Embeddings (pgvector pour fallback / similarité côté Postgres)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE item_embedding (
  item_id UUID PRIMARY KEY REFERENCES item(id) ON DELETE CASCADE,
  embedding vector(1024),             -- BGE-M3 = 1024 dims
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX item_embedding_hnsw ON item_embedding USING hnsw (embedding vector_cosine_ops);
```

**Justifications clés** :
- On garde **`dc_metadata` en EAV** (clé/valeur) pour ne pas exploser le schéma : Dublin Core a 55+ éléments qualifiés, et l'extensibilité est un argument FAIR.
- **`Bitstream`** parce que c'est le vocabulaire DSpace que tout bibliothécaire reconnaît.
- **Embeddings stockés dans Postgres (pgvector) ET indexés dans OpenSearch k-NN** : Postgres = source de vérité, OpenSearch = moteur de requête. C'est la pratique standard.
- **`status` ENUM-like** modélise le workflow de soumission OpenAIRE/DSpace.

---

## 4. Architecture technique

### 4.1 Diagramme de composants

```
┌──────────────────────────────────────────────────────────────────────┐
│                       Next.js 15 (App Router)                         │
│   Pages: /, /search, /items/[id], /submit, /review, /admin          │
│   SSR pour SEO (schema.org JSON-LD), shadcn/ui + Tailwind            │
└──────────────────────────┬───────────────────────────────────────────┘
                           │ HTTPS REST + JSON
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      FastAPI 0.110+ (Python 3.11)                     │
│  Routers: auth, items, search, ingest, review, oai, admin            │
│  Auth: OAuth2 password + JWT (python-jose) + RBAC dependency         │
│  ORM: SQLAlchemy 2.0 async + Alembic                                 │
│  Validation: Pydantic v2                                              │
└──┬─────────────┬─────────────┬──────────────┬──────────────┬─────────┘
   │             │             │              │              │
   ▼             ▼             ▼              ▼              ▼
┌──────┐   ┌──────────┐   ┌──────────┐   ┌────────┐   ┌───────────┐
│ PG   │   │OpenSearch│   │ MinIO    │   │ Redis  │   │ Celery    │
│ 16   │   │   2.x    │   │ (S3 API) │   │  7     │   │ workers   │
│+pgvec│   │ +k-NN    │   │  PDFs    │   │ broker │   │ (async    │
└──────┘   └──────────┘   └──────────┘   └────────┘   │  ingest)  │
                                                       └─────┬─────┘
                                                             │
                                              ┌──────────────┴──────────────┐
                                              ▼                             ▼
                                       ┌──────────────┐            ┌──────────────┐
                                       │   GROBID     │            │ LLM API      │
                                       │ (Docker)     │            │ (Claude Haiku│
                                       │ PDF→TEI XML  │            │  ou GPT-4o-m)│
                                       └──────────────┘            └──────────────┘
                                              │                             │
                                              ▼                             ▼
                                       ┌──────────────┐            ┌──────────────┐
                                       │ BGE-M3       │            │ Tesseract OCR│
                                       │ (sentence-   │            │ (si scan)    │
                                       │  transformers│            └──────────────┘
                                       └──────────────┘
```

**Pourquoi cette stack** :
- **FastAPI** : async natif, OpenAPI auto-généré (gain de temps énorme pour la doc/démo), Pydantic v2.
- **PostgreSQL 16 + pgvector** : transactionnel, JSONB pour metadata, extension vectorielle mature.
- **OpenSearch 2.x** : facettes (aggregations), BM25, **k-NN natif**, **Reciprocal Rank Fusion (RRF) intégré depuis 2.19**, opensource Apache 2.0 (≠ Elasticsearch passé en SSPL).
- **MinIO** : S3-compatible, opensource, démarrable en 1 commande Docker.
- **Celery + Redis** : pipeline d'ingestion async pour ne pas bloquer l'UI quand un PDF de 200 pages arrive.
- **GROBID** : Java/Docker, **>90 % accuracy** sur métadonnées scholarly, mature (CERN, ResearchGate l'utilisent).
- **BGE-M3** : embeddings multilingues (>100 langues, **excellent en français**), 1024 dims, opensource, 63.0 MTEB, dense + sparse + multi-vector dans un seul modèle. Hébergeable localement ou via API HuggingFace.

### 4.2 Pipeline d'ingestion PDF (cœur de la démo IA)

```
[Auteur upload PDF]
        │
        ▼
1. POST /items + multipart file        → FastAPI valide MIME/taille (max 100 MB)
        │
        ▼
2. Upload MinIO (storage_key)          → checksum SHA-256, bitstream créé en BDD
        │
        ▼
3. enqueue Celery task: ingest_pdf(item_id, bitstream_id)
        │  (réponse 202 Accepted à l'auteur, polling WebSocket/SSE pour live UI)
        │
        ▼
┌──────────────────── Worker Celery ────────────────────┐
│                                                        │
│ 4. GROBID --processFullText (Docker REST)             │
│    → TEI XML structuré (header + body + références)   │
│                                                        │
│ 5. Si GROBID rate (PDF scanné) → Tesseract OCR        │
│    (détection : si <100 caractères extraits)          │
│                                                        │
│ 6. Parse TEI : titre, auteurs+affiliations, abstract, │
│    keywords, références (50+ champs)                  │
│                                                        │
│ 7. LLM call (Claude Haiku ou GPT-4o-mini) :           │
│    prompt structuré → JSON validé Pydantic            │
│    → enrichit/corrige ce que GROBID a manqué,         │
│      résumé en français, 5 mots-clés                  │
│                                                        │
│ 8. Classification thématique :                        │
│    embedding(abstract) → cosine vs embeddings de la   │
│    taxonomie (ACM CCS abrégé, ~50 topics)             │
│    → top-3 topics avec scores                         │
│                                                        │
│ 9. Chunking texte (512 tokens, overlap 64)            │
│    → embeddings BGE-M3                                │
│    → INSERT item_embedding (abstract embedding)       │
│    → INSERT chunks dans OpenSearch (knn_vector)       │
│                                                        │
│10. Index OpenSearch document "items" complet         │
│    (titre, abstract, auteurs, year, topics, embedding)│
│                                                        │
│11. Détection doublons :                              │
│    cosine(new.embedding, ANY existing) > 0.95         │
│    → flag duplicate_candidate dans audit              │
│                                                        │
│12. UPDATE item SET status='submitted', ai_extracted_at│
│    Notif WebSocket → UI live                         │
└────────────────────────────────────────────────────────┘
        │
        ▼
[Bibliothécaire voit l'item dans la queue de modération]
```

### 4.3 Workflow de soumission/validation (machine à états)

```
draft ──(submit)──▶ submitted ──(claim)──▶ under_review
                                                │
              ┌──(approve)────────────┐         │
              │                       ▼         │
              │                    approved ◀───┤
              │                       │         │
              │             (publish) │         │
              │                       ▼         │
              ▼                   published     │
          rejected ◀──(reject)─────────────────┘
                            ▲
              under_review ─┘
                            │
                       (request_changes)
                            ▼
                          draft
```

- `draft` : auteur édite ses métadonnées (préremplies par l'IA).
- `submitted` : ingestion IA terminée, en attente de prise en charge.
- `under_review` : un bibliothécaire l'a réservé (lock).
- `approved` : OK pour publication, embargo à attendre éventuellement.
- `published` : indexé dans OpenSearch côté public, exposé via OAI-PMH, schema.org/JSON-LD.
- `rejected` / `withdrawn` : visible uniquement par l'auteur et admins.

---

## 5. Recherche à facettes (OpenSearch hybride)

### 5.1 Mapping de l'index `items`

```json
PUT /items
{
  "settings": {
    "analysis": {
      "analyzer": {
        "fr_std": {"tokenizer": "standard", "filter": ["lowercase","french_elision","french_stop","french_stemmer"]}
      },
      "filter": {
        "french_elision": {"type": "elision", "articles_case": true,
          "articles": ["l","m","t","qu","n","s","j","d","c","jusqu","quoiqu","lorsqu","puisqu"]},
        "french_stop": {"type": "stop", "stopwords": "_french_"},
        "french_stemmer": {"type": "stemmer", "language": "light_french"}
      }
    },
    "index.knn": true
  },
  "mappings": {
    "properties": {
      "title":        {"type": "text", "analyzer": "fr_std", "fields": {"raw": {"type": "keyword"}}},
      "abstract":     {"type": "text", "analyzer": "fr_std"},
      "full_text":    {"type": "text", "analyzer": "fr_std"},
      "authors":      {"type": "keyword"},              // facette
      "year":         {"type": "integer"},              // facette (histogram)
      "department":   {"type": "keyword"},              // facette
      "collection":   {"type": "keyword"},              // facette
      "resource_type":{"type": "keyword"},              // facette
      "topics":       {"type": "keyword"},              // facette
      "keywords":     {"type": "keyword"},              // facette
      "language":     {"type": "keyword"},
      "license":      {"type": "keyword"},
      "doi":          {"type": "keyword"},
      "embedding":    {"type": "knn_vector", "dimension": 1024,
                       "method": {"name":"hnsw","engine":"lucene","space_type":"cosinesimil"}},
      "published_at": {"type": "date"}
    }
  }
}
```

### 5.2 Requête hybride avec RRF (OpenSearch ≥ 2.19)

```json
GET /items/_search
{
  "size": 20,
  "_source": ["title","authors","year","abstract","topics","doi"],
  "query": {
    "hybrid": {
      "queries": [
        { "multi_match": {
            "query": "détection de fraude par apprentissage non supervisé",
            "fields": ["title^3","abstract^2","full_text","keywords^2"],
            "type": "best_fields"
        }},
        { "knn": {
            "embedding": {
              "vector": [/* 1024 floats from BGE-M3 of the user query */],
              "k": 50
            }
        }}
      ]
    }
  },
  "aggs": {
    "by_year":       {"date_histogram": {"field":"published_at","calendar_interval":"year"}},
    "by_author":     {"terms": {"field":"authors","size":10}},
    "by_topic":      {"terms": {"field":"topics","size":10}},
    "by_dept":       {"terms": {"field":"department","size":10}},
    "by_type":       {"terms": {"field":"resource_type","size":5}},
    "by_language":   {"terms": {"field":"language","size":5}}
  },
  "search_pipeline": "hybrid-rrf-pipeline"
}
```

Avec un **search pipeline RRF** créé une fois :

```json
PUT /_search/pipeline/hybrid-rrf-pipeline
{
  "phase_results_processors": [
    { "score-ranker-processor": {
        "combination": { "technique": "rrf", "parameters": { "rank_constant": 60 } }
    }}
  ]
}
```

**Pourquoi RRF** : opère sur les **rangs**, pas sur les scores bruts (BM25 et cosine sont incomparables). C'est devenu le baseline standard (OpenSearch, Elasticsearch, Azure, Weaviate l'ont tous adopté). Stabilité +++.

Sources : [OpenSearch RRF blog](https://opensearch.org/blog/introducing-reciprocal-rank-fusion-hybrid-search/), [OpenSearch neural search tutorial](https://docs.opensearch.org/latest/tutorials/vector-search/neural-search-tutorial/), [BigData Boutique RRF](https://bigdataboutique.com/blog/reciprocal-rank-fusion-how-it-works-and-when-to-use-it).

---

## 6. Couche IA — détaillée

### 6.1 Choix des modèles (recommandation finale)

| Brique | Choix recommandé | Alternative | Justification |
|---|---|---|---|
| **Embeddings** | **BGE-M3** (BAAI, 1024 dims, multilingue, MIT) via `sentence-transformers` local ou API HF | `multilingual-e5-large` (1024 dims) ou `jina-embeddings-v3` | Meilleur ratio qualité/coût en français, dense+sparse+multi-vector dans un seul modèle, opensource pur. 63.0 MTEB. |
| **LLM extraction** | **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) | GPT-4o-mini | Excellent en JSON structuré, latence faible, peu cher (~0,25 $/MTok input). Permet de citer « on utilise Claude » en démo. |
| **Cross-encoder rerank** | `BAAI/bge-reranker-v2-m3` (optionnel) | Cohere rerank | Améliore +10–15 % de NDCG@10 sur recherche hybride. À activer si temps. |
| **OCR fallback** | **Tesseract 5** + `pytesseract` + langpacks `fra+eng` | Surya / docTR | Mature, gratuit, suffisant pour un PDF scanné occasionnel. |
| **Parser scholarly** | **GROBID 0.8+** (Docker) | CERMINE, Marker | >90 % précision métadonnées académiques. Standard dans la communauté. |

### 6.2 Prompt d'extraction (JSON-mode strict)

```python
EXTRACTION_PROMPT = """Tu es un assistant d'extraction de métadonnées bibliographiques.
Analyse l'extrait suivant d'un document scientifique (première et dernière pages, et abstract si présent) et retourne UNIQUEMENT un JSON conforme au schéma fourni. N'invente AUCUNE donnée : si un champ est introuvable, mets null.

Texte:
\"\"\"{text_snippet}\"\"\"

Schéma de sortie JSON:
{
  "title": "string",
  "subtitle": "string|null",
  "language": "fr|en|...",
  "abstract": "string (max 1500 caractères, en français si possible)",
  "authors": [
    {"family_name":"string","given_name":"string","affiliation":"string|null","orcid":"string|null","email":"string|null"}
  ],
  "advisors": [{"family_name":"string","given_name":"string"}],
  "keywords": ["string", ... max 7],
  "resource_type": "thesis|master thesis|article|report|book chapter",
  "publication_year": 2024,
  "institution": "string|null",
  "doi": "string|null",
  "references_count": 42,
  "language_detected_confidence": 0.95
}

Retourne uniquement le JSON, sans backticks ni commentaires.
"""
```

Côté code on appelle avec **Pydantic v2 model_validate_json** pour rejeter immédiatement toute sortie malformée et re-prompter (1 retry max).

### 6.3 Classification thématique zero-shot

```python
# Taxonomie : sous-ensemble ACM CCS abrégé + disciplines locales
TAXONOMY = {
  "cs.AI": "Intelligence artificielle",
  "cs.ML": "Apprentissage automatique",
  "cs.NLP": "Traitement du langage naturel",
  "cs.SE": "Génie logiciel",
  "cs.DB": "Bases de données",
  "math.PR": "Probabilités et statistiques",
  "eco.FIN": "Finance et économie",
  "bio.MED": "Biologie et médecine",
  # ... ~50 topics
}

# Au boot : on calcule l'embedding de chaque label (BGE-M3) — 1 fois
# Au runtime : cosine(item.abstract_embedding, topic_embedding) → top-3
def classify(item_embedding, topic_embeddings, k=3, threshold=0.55):
    sims = cosine_similarity(item_embedding, topic_embeddings)  # vectorisé
    top = np.argsort(-sims)[:k]
    return [(code, float(sims[i])) for code,i in zip(codes[top], top) if sims[i] >= threshold]
```

**Validation humaine** : le bibliothécaire voit les topics suggérés avec leur score et peut les confirmer/corriger dans l'UI (`source` passe de `ai` à `validated`).

### 6.4 RAG sémantique (recherche en langage naturel — wow factor démo)

Endpoint `POST /search/ask` :

```
1. user_query = "Quels mémoires parlent de détection de fraude bancaire ?"
2. q_embedding = BGE-M3(user_query)
3. Hybrid search OpenSearch (BM25 + k-NN, RRF) → top 20 items
4. Rerank cross-encoder bge-reranker-v2-m3 → top 5
5. Construit le contexte : pour chaque item, on récupère ses 2 meilleurs chunks
6. Prompt LLM :
   "Réponds à la question en t'appuyant UNIQUEMENT sur les extraits ci-dessous.
    Cite chaque affirmation par [Item:{handle}].
    Si l'information n'est pas dans les extraits, dis-le explicitement."
7. Réponse renvoyée + objet `sources: [{item_id, handle, title, score}]`
```

Le frontend affiche la réponse **avec liens cliquables** vers les fiches → effet « Perplexity pour la science universitaire ».

### 6.5 Détection de doublons

À l'ingestion : `SELECT item_id FROM item_embedding WHERE embedding <=> :new_embedding < 0.05 LIMIT 5;` (distance cosine, pgvector). Si match > 0.95 similarité → flag `duplicate_candidate` dans l'audit log, affiché au validateur.

---

## 7. API REST FastAPI — Endpoints

### 7.1 Liste exhaustive (groupée par routeur)

| Méthode | Path | Auth | Description |
|---|---|---|---|
| **auth** | | | |
| POST | `/auth/register` | – | Création compte (rôle `author` par défaut) |
| POST | `/auth/login` | – | OAuth2 password → JWT |
| GET | `/auth/me` | JWT | Profil courant |
| **items (public)** | | | |
| GET | `/items` | – | Liste paginée filtrée (published only) |
| GET | `/items/{id}` | – | Fiche détaillée |
| GET | `/items/{id}/datacite.xml` | – | Export DataCite |
| GET | `/items/{id}/citation.bib` | – | BibTeX |
| GET | `/items/{id}/file/{bitstream_id}` | – | Téléchargement (vérifie embargo) |
| **items (auth)** | | | |
| POST | `/items` | author | Crée brouillon + upload PDF + déclenche pipeline IA |
| PATCH | `/items/{id}` | author/lib | Modifie métadonnées (état: draft uniquement pour author) |
| POST | `/items/{id}/submit` | author | draft → submitted |
| GET | `/items/{id}/ingest-status` | author | SSE/poll de l'avancement IA |
| **search** | | | |
| GET | `/search` | – | Recherche à facettes hybride (q, filters, page) |
| POST | `/search/ask` | – | RAG en langage naturel (Q&A) |
| GET | `/search/suggest` | – | Autocomplétion (titre + auteur) |
| **review** | | | |
| GET | `/review/queue` | librarian | Items à valider |
| POST | `/review/{item_id}/claim` | librarian | Verrouille pour soi |
| POST | `/review/{item_id}/decide` | librarian | approve/reject/request_changes |
| **oai** (sans préfixe `/api`) | | | |
| GET | `/oai?verb=Identify` | – | OAI-PMH Identify |
| GET | `/oai?verb=ListRecords&metadataPrefix=oai_dc` | – | Moisson DC |
| GET | `/oai?verb=GetRecord&identifier=...` | – | Un record |
| **admin** | | | |
| POST | `/admin/communities` | admin | CRUD communities/collections |
| GET | `/admin/audit` | admin | Audit log paginé |
| POST | `/admin/reindex` | admin | Réindexation OpenSearch |

### 7.2 Exemple OpenAPI (extrait)

```yaml
paths:
  /items:
    post:
      summary: Soumettre un nouveau travail scientifique
      security: [{bearerAuth: []}]
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              required: [collection_id, file, license_code]
              properties:
                collection_id: {type: string, format: uuid}
                license_code:  {type: string, example: "CC-BY-4.0"}
                file:          {type: string, format: binary}
                title_hint:    {type: string, description: "Optionnel; sinon IA"}
      responses:
        '202':
          description: Accepté, ingestion IA en cours
          content:
            application/json:
              schema:
                type: object
                properties:
                  item_id:        {type: string, format: uuid}
                  status:         {type: string, example: "draft"}
                  ingest_job_id:  {type: string}
                  poll_url:       {type: string}

  /search:
    get:
      parameters:
        - {name: q, in: query, schema: {type: string}}
        - {name: year, in: query, schema: {type: integer}}
        - {name: author, in: query, schema: {type: string}}
        - {name: topic, in: query, schema: {type: string}}
        - {name: type, in: query, schema: {type: string}}
        - {name: mode, in: query, schema: {type: string, enum: [hybrid, lexical, semantic], default: hybrid}}
        - {name: page, in: query, schema: {type: integer, default: 1}}
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                properties:
                  total:   {type: integer}
                  hits:    {type: array, items: {$ref: '#/components/schemas/ItemSummary'}}
                  facets:  {$ref: '#/components/schemas/Facets'}
```

---

## 8. Frontend — Next.js 15

**Choix : Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + TanStack Query.**

Pourquoi pas SvelteKit ? Next.js a un meilleur écosystème de composants pro (shadcn, Radix), Cursor le maîtrise parfaitement, SSR pour le SEO/JSON-LD est trivial.

### Pages prioritaires (par effet jury décroissant)

1. **`/search`** — Page maîtresse.
    - Barre de recherche avec **toggle Lexical / Sémantique / Hybride**.
    - Sidebar facettes (année, auteur, département, type, topic, langue) — accordéon.
    - Cartes résultats avec snippet highlighté, score, badges topics.
    - Bouton **"Demander à OpenScience"** (mode RAG conversationnel).

2. **`/items/[id]`** — Fiche détaillée
    - Hero : titre, auteurs (chips ORCID cliquables), année, DOI, citation BibTeX/APA en un clic.
    - Onglets : Résumé / Métadonnées DC complètes / Sommaire (TOC IA) / Références extraites / Téléchargement.
    - Bloc **JSON-LD schema.org/ScholarlyArticle injecté en SSR** dans `<head>`.

3. **`/submit`** — Wizard multi-étapes
    - Étape 1 : upload PDF → progress bar pipeline IA en temps réel (SSE) :
      `Upload ✓ → Extraction texte (GROBID) ✓ → Analyse IA ✓ → Classification ✓`
    - Étape 2 : **formulaire pré-rempli** avec valeurs IA + badge confiance, l'auteur corrige.
    - Étape 3 : choix licence + embargo + collection → soumettre.

4. **`/review`** — Espace bibliothécaire
    - Queue Kanban : `submitted | under_review | approved`.
    - Vue diff : « ce que l'IA a extrait » vs « ce que l'auteur a corrigé », flag doublons.
    - Boutons valider/rejeter/demander correction + zone de commentaire.

5. **`/admin`** — Communautés, collections, utilisateurs, audit log, statistiques (dépôts/jour, top topics).

6. **`/`** — Landing : stats live (X publications, Y auteurs, Z téléchargements), top 5 récents, barre de recherche centrale.

---

## 9. Sécurité & droits d'accès

| Concern | Implémentation |
|---|---|
| **Auth** | OAuth2 password grant → JWT (RS256, 24h) + refresh token. `python-jose` + `passlib[bcrypt]`. |
| **RBAC** | Dependency FastAPI `require_role("librarian")` qui lit les claims JWT. Table `user_role`. |
| **Embargo** | À chaque GET `/items/{id}/file/*` : si `embargo_until > today` et user ≠ submitter/librarian/admin → 403. |
| **Restricted items** | Status ≠ published → invisibles dans `/search` et `/oai`. |
| **Watermark PDF** | Avant servir un PDF : `pypdf` overlay « Téléchargé via OpenScience Hub par {user.email} le {date} » sur chaque page. Acceptable en MVP, à mentionner comme feature « rights management ». |
| **Audit log** | Décorateur FastAPI `@audit("item.download")` qui inscrit dans `audit_log`. Visible admin. |
| **CSRF / CORS** | CORS strict (origin frontend uniquement). Token JWT en `Authorization: Bearer` → pas vulnérable CSRF. |
| **Upload validation** | Magic bytes (python-magic) — pas confiance dans le MIME déclaré, taille max 100 MB. |
| **Rate limiting** | `slowapi` sur `/auth/login` (5/min) et `/search/ask` (LLM coûteux : 10/min/user). |
| **Secrets** | `.env` + `pydantic-settings`, jamais commit. |
| **HTTPS** | Caddy en reverse proxy (auto-TLS) en démo prod. |

---

## 10. Plan d'exécution 24 h (4 personnes recommandées)

Hypothèse : 4 dev, début H0, fin H24, démo H24+1. Si vous êtes 3 : Personne D fusionne avec C.

### Découpage par rôle

| Rôle | Personne | Responsabilité |
|---|---|---|
| **A — Backend Core** | Dev senior Python | FastAPI, modèles SQLAlchemy, migrations Alembic, auth, CRUD items, workflow |
| **B — Search & IA** | Dev Python + ML | OpenSearch mapping, pipeline ingestion Celery, GROBID, LLM extraction, RAG |
| **C — Frontend** | Dev front | Next.js, pages search/item/submit/review, intégration API |
| **D — DevOps & Données** | Polyvalent | Docker-compose, MinIO, seed data réaliste (20 mémoires factices), démo |

### Timeline horaire

```
H0–H2   ┃ Setup + Lecture commune du plan
        ┃  • Repo cloné, branches Git par dev
        ┃  • docker-compose.yml (Postgres+pgvector, OpenSearch, MinIO, Redis, GROBID, FastAPI, Next.js)
        ┃  • Alembic init + premières migrations (schéma §3.2)
        ┃  • Variables d'env, secrets Anthropic/OpenAI

H2–H6   ┃ Vertical slice « Hello Item »
        ┃  A : POST/GET /items + Pydantic schemas + auth basique
        ┃  B : OpenSearch index créé, indexation manuelle d'un item
        ┃  C : page /search + /items/[id] avec données mock
        ┃  D : seed script (10 PDFs réels de thèses publiques HAL)
        ┃ ✅ Checkpoint : afficher 1 item sur le front

H6–H12  ┃ Pipeline d'ingestion IA (CŒUR)
        ┃  A : workflow états + endpoints /submit /review
        ┃  B : Celery + GROBID Docker + LLM extraction + embeddings BGE-M3
        ┃        + indexation OpenSearch + classification topics
        ┃  C : wizard /submit avec SSE progress + page /review
        ┃  D : préparation 5 PDFs « scénario démo » (1 thèse, 2 mémoires, 2 articles)
        ┃ ✅ Checkpoint H12 : upload PDF → fiche pré-remplie en <60s

H12–H16 ┃ Recherche hybride + facettes + RAG
        ┃  A : OAI-PMH (3 verbes) + export DataCite + BibTeX
        ┃  B : query hybride RRF + endpoint /search/ask (RAG)
        ┃  C : UI facettes + page « Ask »
        ┃  D : tests end-to-end + jeu de démo enrichi

H16–H20 ┃ Polish UX + standards visibles
        ┃  Tous : JSON-LD schema.org, page about/FAIR, citation modal,
        ┃        watermark PDF, dashboard admin minimal
        ┃  C : design system shadcn, dark mode, animations

H20–H22 ┃ Démo prep
        ┃  D : script de démo écrit, run-through chronométré 3×
        ┃  A/B : derniers bugs critiques, seed parfait
        ┃  C : transitions UI fluides

H22–H24 ┃ Freeze + dry-run + slides
        ┃  Slides minimaux : 1 problème, 1 archi, 1 demo live, 1 « what's next »
        ┃  README pro avec captures + diagramme archi
```

### MVP minimum (à atteindre absolument)
- Upload PDF + extraction IA + fiche pré-remplie + validation
- Recherche hybride avec facettes
- RAG « Ask OpenScience »
- OAI-PMH minimal (verbe `ListRecords` Dublin Core)
- 3 rôles fonctionnels (visiteur, auteur, bibliothécaire)

### Nice-to-have
- Cross-encoder reranking
- Détection de doublons UI
- ORCID OAuth réel
- Génération de DOI réelle (DataCite sandbox)
- Watermark PDF dynamique
- Dashboard admin avec métriques

---

## 11. Pitch de démo (5 min — scénario exact)

> **Personnages** : « Jordan » (auteur), « Mme Konaté » (bibliothécaire), jury = public.

**[0:00–0:30] Le problème (slide 1)**
> « Dans nos universités, 80 % des mémoires de master finissent dans un PDF perdu sur un disque dur. Pas de catalogue, pas de recherche, pas de visibilité. Les bonnes plateformes — DSpace, Invenio — existent mais demandent un bibliothécaire à temps plein pour saisir les métadonnées de chaque dépôt. **Nous proposons un répertoire institutionnel où l'IA fait 90 % du travail.** »

**[0:30–1:30] Démo upload — l'effet « waouh »**
- Connexion en tant qu'auteur. Va sur `/submit`.
- Drag-and-drop d'une vraie thèse PDF (préparée).
- **À l'écran, live** : `Upload ✓ → GROBID extrait le texte ✓ → Claude analyse les métadonnées ✓ → BGE-M3 calcule l'empreinte sémantique ✓ → Classification : cs.ML, cs.AI, math.PR ✓`
- En 45 s, le formulaire est rempli : titre, 3 auteurs avec affiliations, abstract, 5 mots-clés, année, type = « thèse de doctorat ».
- L'auteur **corrige une virgule**, choisit licence CC-BY, soumet.

**[1:30–2:30] Validation bibliothécaire**
- Bascule sur `/review` en tant que Mme Konaté.
- Queue Kanban, item arrivé.
- Diff IA / auteur, flag « doublon potentiel à 87 % avec item #42 » → on rejette le flag (différent), on approuve.
- Item passe `published`.

**[2:30–4:00] Recherche — la valeur publique**
- Mode visiteur, page `/search`.
- Recherche **lexicale** : « apprentissage non supervisé fraude ». Résultats avec facettes (année 2022–2026, département, topics).
- Filtre sur **topic = cs.ML** → 7 résultats. **Clic année 2024** → 3 résultats. Fluide.
- Switch sur mode **« Demander à OpenScience »** (RAG).
- Question : *« Quelles méthodes ont été testées pour détecter la fraude bancaire dans les mémoires de notre université ? »*
- Réponse synthétique en 5 lignes, **avec citations cliquables** vers 3 fiches.

**[4:00–4:30] Standards et interopérabilité — argument FAIR**
- Ouvre l'URL `http://localhost:8000/oai?verb=ListRecords&metadataPrefix=oai_dc` dans un onglet → XML Dublin Core propre.
- Ouvre la fiche, **View source** : JSON-LD schema.org/ScholarlyArticle visible.
- *« Notre dépôt est moissonnable par Google Scholar et OpenAIRE dès la mise en ligne. C'est un dépôt scientifique sérieux, pas un dossier Drive. »*

**[4:30–5:00] Conclusion**
- Slide récap : 4 rôles, FastAPI + OpenSearch + IA, conforme OAI-PMH/Dublin Core/FAIR, ~5 000 LOC.
- Roadmap : ORCID OAuth réel, DOI DataCite, plagiat (Thème 3 complémentaire).
- *« OpenScience Hub : votre patrimoine scientifique enfin trouvable. »*

### Astuces démo
- **Préchauffer GROBID** (premier appel = lent à cause du chargement du modèle).
- Précalculer embeddings de 20 items pour que `/search` ait du contenu.
- Avoir un **fallback vidéo screencast** si le wifi du hackathon meurt.
- Code des slides ≤ 3, parler **du métier** plus que de la stack.
- Mode plein écran navigateur, pointer souris bien visible.

---

## 12. Références

### Plateformes opensource étudiées
- DSpace : https://dspace.lyrasis.org/ — docs : https://wiki.lyrasis.org/display/DSDOC8x
- InvenioRDM (CERN) : https://inveniordm.docs.cern.ch/
- EPrints : https://www.eprints.org/
- Samvera/Hyrax : https://samvera.org/
- Islandora : https://islandora.ca/
- Omeka-S : https://omeka.org/s/
- Comparaison UBC : https://open.library.ubc.ca/media/stream/pdf/42591/1.0075768/1
- SIS Wiki : https://wiki-slis.apps.wayne.edu/index/Institutional_Repository_Platforms.html

### Standards
- Dublin Core (DCMI Terms) : https://www.dublincore.org/specifications/dublin-core/dcmi-terms/
- DataCite Schema 4.5 : https://schema.datacite.org/
- DataCite OAI-PMH Guide : https://support.datacite.org/docs/datacite-oai-pmh
- OAI-PMH 2.0 spec : https://www.openarchives.org/OAI/openarchivesprotocol.html
- OpenAIRE Guidelines : https://guidelines.openaire.eu/
- schema.org/ScholarlyArticle : https://schema.org/ScholarlyArticle
- ORCID API : https://info.orcid.org/documentation/
- COAR Resource Types : https://vocabularies.coar-repositories.org/resource_types/
- FAIR principles : https://www.go-fair.org/fair-principles/

### Extraction PDF & IA
- GROBID : https://github.com/kermitt2/grobid — docs : https://grobid.readthedocs.io/
- Benchmark PDF extraction (Meuschke et al., 2023) : https://arxiv.org/abs/2303.09957
- BGE-M3 : https://huggingface.co/BAAI/bge-m3
- BGE Reranker v2 m3 : https://huggingface.co/BAAI/bge-reranker-v2-m3
- jina-embeddings-v3 : https://arxiv.org/abs/2409.10173
- Sentence-transformers : https://www.sbert.net/
- Tesseract OCR : https://github.com/tesseract-ocr/tesseract

### Recherche hybride
- OpenSearch RRF blog : https://opensearch.org/blog/introducing-reciprocal-rank-fusion-hybrid-search/
- OpenSearch neural search tutorial : https://docs.opensearch.org/latest/tutorials/vector-search/neural-search-tutorial/
- Elastic RRF docs : https://www.elastic.co/docs/reference/elasticsearch/rest-apis/reciprocal-rank-fusion
- pgvector : https://github.com/pgvector/pgvector

### Stack web
- FastAPI : https://fastapi.tiangolo.com/
- SQLAlchemy 2.0 async : https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html
- Celery : https://docs.celeryq.dev/
- Next.js App Router : https://nextjs.org/docs/app
- shadcn/ui : https://ui.shadcn.com/
- MinIO : https://min.io/docs/

### Cursor (pour info équipe)
- Cursor docs : https://docs.cursor.com/
- Mode Plan / Composer / YOLO : voir guide officiel hackathon

---

**Prêts à coder. Que la meilleure équipe gagne — vous.**