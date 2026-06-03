# Plan d'Implémentation — Module de Gestion de Documents

**Stack :** NestJS · React Native · PostgreSQL · MinIO · Prolog  
**Date :** Juin 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Modèle de données](#3-modèle-de-données)
4. [Phases d'implémentation](#4-phases-dimplémentation)
5. [API REST — Endpoints](#5-api-rest--endpoints)
6. [Module Prolog](#6-module-prolog)
7. [Module RAG](#7-module-rag)
8. [Application React Native](#8-application-react-native)
9. [Schéma de déploiement](#9-schéma-de-déploiement)

---

## 1. Vue d'ensemble

Le système est une **bibliothèque numérique académique** permettant de déposer, classer, rechercher et consulter deux grandes familles de documents :

| Catégorie | Types inclus |
|-----------|-------------|
| **Ressource pédagogique** | Cours PDF, TD, TP, Examen, Correction, Support de cours |
| **Production scientifique** | Mémoire, Thèse, Article, Rapport de recherche |

### Principes directeurs

- La navigation suit la hiérarchie académique : `Faculté → Département → Formation → UE → Ressource`
- Le contrôle d'accès repose sur trois niveaux simples : `PUBLIC | CAMPUS | PRIVE`
- Le stockage est séparé : **PostgreSQL** pour les métadonnées, **MinIO** pour les binaires PDF
- **Prolog** gère exclusivement : classification automatique, recommandations et prérequis académiques
- Le **RAG** permet à l'IA de répondre à partir des documents internes de l'université

---

## 2. Architecture technique

```
┌────────────────────────────────────────────────────────────────┐
│                        React Native App                        │
│          (Expo · React Query · React Navigation)               │
└────────────────────────┬───────────────────────────────────────┘
                         │ HTTP/REST + JWT
┌────────────────────────▼───────────────────────────────────────┐
│                   NestJS API (Backend)                         │
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Auth Module  │  │  Doc Module  │  │   RAG Module         │ │
│  │ JWT + Guards │  │  CRUD + ACL  │  │  Chunk + Embedding   │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Org. Module  │  │ File Module  │  │  Prolog Bridge       │ │
│  │ Fac/Dep/UE   │  │ MinIO Upload │  │  SWI-Prolog + HTTP   │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└────────┬──────────────────┬──────────────────┬─────────────────┘
         │                  │                  │
┌────────▼────────┐  ┌──────▼──────┐  ┌───────▼──────────────┐
│   PostgreSQL    │  │    MinIO    │  │   SWI-Prolog Server  │
│  + pgvector     │  │  (Fichiers) │  │   (port 8080)        │
│  (Métadonnées)  │  │             │  │                      │
└─────────────────┘  └─────────────┘  └──────────────────────┘
```

### Technologies par couche

| Couche | Technologie | Justification |
|--------|-------------|---------------|
| API | NestJS + TypeScript | Modules, Guards, Pipes, DI |
| ORM | TypeORM | Migrations, entités décorées |
| Auth | JWT + Passport | Stateless, mobile-friendly |
| Fichiers | MinIO SDK | S3-compatible, auto-hébergé |
| Vecteurs | pgvector (extension PostgreSQL) | Recherche sémantique intégrée |
| IA | OpenAI / Ollama | Embeddings + génération RAG |
| Prolog | SWI-Prolog + pengine ou HTTP API | Inférence logique |
| Mobile | React Native (Expo) | iOS + Android |
| Cache | Redis (optionnel phase 2) | Sessions, résultats de recherche |

---

## 3. Modèle de données

### 3.1 Entités principales

#### `Ressource` (anciennement Document)

```sql
CREATE TYPE type_document AS ENUM (
  'COURS', 'TD', 'TP', 'EXAMEN', 'CORRECTION', 'SUPPORT_COURS',
  'MEMOIRE', 'THESE', 'ARTICLE', 'RAPPORT_RECHERCHE', 'AUTRE'
);

CREATE TYPE categorie_document AS ENUM (
  'RESSOURCE_PEDAGOGIQUE', 'PRODUCTION_SCIENTIFIQUE'
);

CREATE TYPE niveau_acces AS ENUM ('PUBLIC', 'CAMPUS', 'PRIVE');

CREATE TABLE ressource (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre           VARCHAR(500) NOT NULL,
  description     TEXT,
  type_document   type_document NOT NULL,
  categorie       categorie_document NOT NULL,
  annee           SMALLINT,
  langue          VARCHAR(10) DEFAULT 'fr',
  niveau_acces    niveau_acces NOT NULL DEFAULT 'CAMPUS',
  proprietaire_id UUID NOT NULL REFERENCES utilisateur(id),
  statut_validation VARCHAR(20) DEFAULT 'EN_ATTENTE',
  doi             VARCHAR(200),
  date_depot      TIMESTAMP DEFAULT NOW(),
  date_maj        TIMESTAMP DEFAULT NOW()
);
```

**Règle de contrôle d'accès :**
- `PUBLIC` → tout le monde (visiteur anonyme inclus)
- `CAMPUS` → utilisateur authentifié (étudiant ou enseignant)
- `PRIVE` → uniquement le `proprietaire_id`

#### `Fichier`

```sql
CREATE TABLE fichier (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ressource_id  UUID NOT NULL REFERENCES ressource(id) ON DELETE CASCADE,
  nom_original  VARCHAR(500) NOT NULL,
  taille_octets BIGINT,
  mime_type     VARCHAR(100) DEFAULT 'application/pdf',
  hash_sha256   VARCHAR(64),
  minio_bucket  VARCHAR(100) NOT NULL,
  minio_key     VARCHAR(500) NOT NULL,
  version       SMALLINT DEFAULT 1,
  date_upload   TIMESTAMP DEFAULT NOW()
);
```

#### Organisation académique

```sql
CREATE TABLE faculte (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code  VARCHAR(20) UNIQUE NOT NULL,
  nom   VARCHAR(300) NOT NULL,
  sigle VARCHAR(20)
);

CREATE TABLE departement (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculte_id  UUID NOT NULL REFERENCES faculte(id),
  code        VARCHAR(20) UNIQUE NOT NULL,
  nom         VARCHAR(300) NOT NULL
);

CREATE TYPE niveau_formation AS ENUM ('L1','L2','L3','M1','M2','D');

CREATE TABLE formation (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  departement_id  UUID NOT NULL REFERENCES departement(id),
  code            VARCHAR(20) UNIQUE NOT NULL,
  nom             VARCHAR(300) NOT NULL,
  niveau          niveau_formation NOT NULL
);

CREATE TABLE ue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  formation_id UUID NOT NULL REFERENCES formation(id),
  code         VARCHAR(20) UNIQUE NOT NULL,
  nom          VARCHAR(300) NOT NULL,
  semestre     SMALLINT CHECK (semestre BETWEEN 1 AND 12),
  credits_ects SMALLINT
);

CREATE TABLE ressource_ue (
  ressource_id UUID NOT NULL REFERENCES ressource(id) ON DELETE CASCADE,
  ue_id        UUID NOT NULL REFERENCES ue(id) ON DELETE CASCADE,
  PRIMARY KEY (ressource_id, ue_id)
);
```

#### RAG — Chunks & Embeddings

```sql
-- Activation de l'extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE chunk (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ressource_id UUID NOT NULL REFERENCES ressource(id) ON DELETE CASCADE,
  numero       SMALLINT NOT NULL,
  contenu      TEXT NOT NULL,
  page_debut   SMALLINT,
  page_fin     SMALLINT,
  taille_tokens SMALLINT
);

CREATE TABLE embedding (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id         UUID NOT NULL REFERENCES chunk(id) ON DELETE CASCADE,
  modele           VARCHAR(100) NOT NULL DEFAULT 'text-embedding-3-small',
  dimension        SMALLINT NOT NULL DEFAULT 1536,
  vecteur          vector(1536)
);

-- Index de recherche cosinus
CREATE INDEX ON embedding USING ivfflat (vecteur vector_cosine_ops)
  WITH (lists = 100);
```

#### Classification & Mots-clés

```sql
CREATE TABLE thematique (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         VARCHAR(200) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE ressource_thematique (
  ressource_id   UUID NOT NULL REFERENCES ressource(id),
  thematique_id  UUID NOT NULL REFERENCES thematique(id),
  score          FLOAT,
  origine        VARCHAR(20) DEFAULT 'MANUELLE', -- MANUELLE | PROLOG | IA
  PRIMARY KEY (ressource_id, thematique_id)
);

CREATE TABLE mot_cle (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  libelle VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE ressource_mot_cle (
  ressource_id UUID NOT NULL REFERENCES ressource(id),
  mot_cle_id   UUID NOT NULL REFERENCES mot_cle(id),
  PRIMARY KEY (ressource_id, mot_cle_id)
);
```

#### Auteurs

```sql
CREATE TABLE auteur (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom         VARCHAR(200) NOT NULL,
  prenom      VARCHAR(200),
  email       VARCHAR(300),
  orcid       VARCHAR(50),
  affiliation VARCHAR(500)
);

CREATE TABLE ressource_auteur (
  ressource_id UUID NOT NULL REFERENCES ressource(id),
  auteur_id    UUID NOT NULL REFERENCES auteur(id),
  ordre        SMALLINT DEFAULT 1,
  PRIMARY KEY (ressource_id, auteur_id)
);
```

#### Consultation & Recherche

```sql
CREATE TABLE consultation (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ressource_id UUID NOT NULL REFERENCES ressource(id),
  utilisateur_id UUID REFERENCES utilisateur(id),
  date_consultation TIMESTAMP DEFAULT NOW()
);

CREATE TABLE telechargement (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ressource_id    UUID NOT NULL REFERENCES ressource(id),
  utilisateur_id  UUID REFERENCES utilisateur(id),
  date_telechargement TIMESTAMP DEFAULT NOW()
);

CREATE TABLE favori (
  utilisateur_id UUID NOT NULL REFERENCES utilisateur(id),
  ressource_id   UUID NOT NULL REFERENCES ressource(id),
  date_ajout     TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (utilisateur_id, ressource_id)
);

CREATE TABLE recherche (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilisateur_id  UUID REFERENCES utilisateur(id),
  requete         TEXT NOT NULL,
  date_recherche  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE resultat_recherche (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recherche_id UUID NOT NULL REFERENCES recherche(id),
  ressource_id UUID NOT NULL REFERENCES ressource(id),
  rang         SMALLINT,
  score        FLOAT
);
```

---

## 4. Phases d'implémentation

### Phase 0 — Infrastructure (Semaine 1)

**Objectifs :** environnement opérationnel, CI/CD de base

```
backend/
├── src/
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── minio.config.ts
│   │   └── jwt.config.ts
│   └── main.ts
docker-compose.yml     # postgres + minio + swiprolog
.env.example
```

**docker-compose.yml (services):**

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: acadoc
      POSTGRES_USER: acadoc
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports: ["9000:9000", "9001:9001"]
    volumes: ["./data/minio:/data"]

  prolog:
    image: swipl:latest
    command: swipl -g "use_module(library(http/thread_httpd)), server(8080), thread_get_message(_)" acadoc.pl
    ports: ["8081:8080"]
    volumes: ["./prolog:/app"]
    working_dir: /app
```

**Livrables :**
- [ ] `docker-compose.yml` fonctionnel
- [ ] Connexion TypeORM vérifiée
- [ ] Bucket MinIO `documents` créé automatiquement
- [ ] Variables d'environnement documentées

---

### Phase 1 — Auth & Utilisateurs (Semaine 2)

**Objectifs :** inscription, connexion JWT, gestion des rôles

**Entités TypeORM :**
- `Utilisateur` (ETUDIANT | ENSEIGNANT | ADMIN)
- `Role`
- `UtilisateurRole`

**NestJS Modules :**

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   └── guards/
│       ├── jwt-auth.guard.ts
│       └── roles.guard.ts
└── users/
    ├── users.module.ts
    ├── users.service.ts
    ├── users.controller.ts
    └── entities/utilisateur.entity.ts
```

**Endpoints :**

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/auth/register` | Créer un compte |
| POST | `/auth/login` | Obtenir JWT |
| GET | `/auth/me` | Profil courant |
| POST | `/auth/refresh` | Rafraîchir le token |

**Livrables :**
- [ ] Register + Login fonctionnel
- [ ] Guard `JwtAuthGuard` appliqué globalement
- [ ] Décorateur `@Roles('ADMIN')` opérationnel
- [ ] Hash bcrypt des mots de passe

---

### Phase 2 — Organisation Académique (Semaine 3)

**Objectifs :** CRUD de la hiérarchie `Faculté → Département → Formation → UE`

```
src/
└── academique/
    ├── faculte/
    │   ├── faculte.entity.ts
    │   ├── faculte.service.ts
    │   └── faculte.controller.ts
    ├── departement/
    ├── formation/
    └── ue/
        ├── ue.entity.ts
        ├── ue.service.ts
        └── ue.controller.ts
```

**Endpoints (exemple UE) :**

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/facultes` | Liste des facultés |
| GET | `/facultes/:id/departements` | Départements d'une faculté |
| GET | `/formations/:id/ues` | UEs d'une formation |
| GET | `/ues/:code` | Détail d'une UE par code |
| POST | `/ues` | Créer une UE (ADMIN) |

**Navigation typique côté client :**

```
GET /facultes
  → GET /facultes/{id}/departements
    → GET /departements/{id}/formations
      → GET /formations/{id}/ues
        → GET /ues/{id}/ressources
```

**Livrables :**
- [ ] Migrations TypeORM pour les 4 entités
- [ ] Seeds de démonstration (ex. Fac. Informatique, L3, M1…)
- [ ] Endpoint de recherche par code UE

---

### Phase 3 — Module Ressource (Semaines 4–5)

**Objectifs :** CRUD complet des ressources avec contrôle d'accès

```
src/
└── ressources/
    ├── ressource.entity.ts
    ├── ressource.module.ts
    ├── ressource.service.ts
    ├── ressource.controller.ts
    ├── dto/
    │   ├── create-ressource.dto.ts
    │   └── update-ressource.dto.ts
    └── guards/
        └── acces-niveau.guard.ts
```

**DTO de création :**

```typescript
export class CreateRessourceDto {
  @IsString() @MaxLength(500)
  titre: string;

  @IsEnum(TypeDocument)
  type_document: TypeDocument;

  @IsEnum(CategorieDocument)
  categorie: CategorieDocument;

  @IsEnum(NiveauAcces)
  niveau_acces: NiveauAcces;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsInt() @Min(1900) @Max(2100)
  annee?: number;

  @IsOptional() @IsString()
  doi?: string;

  @IsArray() @IsUUID('4', { each: true })
  ue_ids: string[];  // Association aux UEs

  @IsArray() @IsUUID('4', { each: true })
  auteur_ids: string[];
}
```

**Guard de contrôle d'accès :**

```typescript
@Injectable()
export class AccesNiveauGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ressource: Ressource = request.ressource;
    const user = request.user;

    switch (ressource.niveau_acces) {
      case 'PUBLIC':
        return true;
      case 'CAMPUS':
        return !!user; // authentifié
      case 'PRIVE':
        return user?.id === ressource.proprietaire_id;
    }
  }
}
```

**Endpoints :**

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/ressources` | Liste paginée (filtrée par ACL) |
| GET | `/ressources/:id` | Détail (avec vérification ACL) |
| POST | `/ressources` | Créer (auth requis) |
| PATCH | `/ressources/:id` | Modifier (propriétaire) |
| DELETE | `/ressources/:id` | Supprimer (propriétaire/admin) |
| GET | `/ues/:id/ressources` | Ressources d'une UE |
| GET | `/ressources/type/:type` | Par type (COURS, TD…) |
| GET | `/ressources/categorie/:cat` | Par catégorie |

**Livrables :**
- [ ] CRUD ressource complet
- [ ] Guard ACL par niveau_acces opérationnel
- [ ] Association Ressource ↔ UE (many-to-many)
- [ ] Filtres : type, catégorie, annee, langue, ue_id

---

### Phase 4 — Stockage Fichiers (Semaine 6)

**Objectifs :** upload PDF vers MinIO, gestion des versions

```
src/
└── fichiers/
    ├── fichier.entity.ts
    ├── fichier.module.ts
    ├── fichier.service.ts
    ├── fichier.controller.ts
    └── minio/
        ├── minio.service.ts
        └── minio.module.ts
```

**Flux d'upload :**

```
Client                    NestJS                   MinIO
  │                          │                       │
  ├─ POST /ressources/:id/fichier ──────────────────►│
  │   (multipart/form-data)  │                       │
  │                          ├─ Calcul SHA-256        │
  │                          ├─ Vérif. doublon        │
  │                          ├─ putObject(bucket,key)►│
  │                          │◄── URL stockage ───────┤
  │                          ├─ INSERT fichier        │
  │◄─ 201 { fichier_id } ────┤                       │
```

**Génération d'URL signée (téléchargement sécurisé) :**

```typescript
async getPresignedUrl(fichierId: string, userId: string): Promise<string> {
  const fichier = await this.fichierRepo.findOne(fichierId, {
    relations: ['ressource']
  });
  // Vérification ACL
  this.aclService.check(fichier.ressource, userId);
  // URL valide 1h
  return this.minioService.presignedGetObject(
    fichier.minio_bucket,
    fichier.minio_key,
    3600
  );
}
```

**Endpoints :**

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/ressources/:id/fichiers` | Upload PDF |
| GET | `/fichiers/:id/download` | URL signée MinIO |
| GET | `/fichiers/:id/info` | Métadonnées fichier |
| DELETE | `/fichiers/:id` | Supprimer (propriétaire) |

**Livrables :**
- [ ] Upload multipart fonctionnel
- [ ] URL présignée générée et respectant l'ACL
- [ ] Déduplication par hash SHA-256
- [ ] Gestion des versions (v1, v2…)

---

### Phase 5 — Chunking & Embeddings RAG (Semaines 7–8)

**Objectifs :** extraction du texte PDF, découpage en chunks, génération d'embeddings

```
src/
└── rag/
    ├── rag.module.ts
    ├── chunking/
    │   ├── chunking.service.ts   # pdf-parse
    │   └── chunking.strategy.ts  # fixed-size / semantic
    ├── embedding/
    │   ├── embedding.service.ts  # OpenAI / Ollama
    │   └── embedding.entity.ts
    └── search/
        ├── search.service.ts     # pgvector cosinus
        └── search.controller.ts
```

**Pipeline de traitement (déclenché après upload) :**

```
PDF (MinIO)
    │
    ▼
pdf-parse → texte brut
    │
    ▼
Découpage en chunks (512 tokens, overlap 50)
    │
    ▼
INSERT chunk[] dans PostgreSQL
    │
    ▼
Pour chaque chunk → OpenAI embeddings API
    │
    ▼
INSERT embedding[] (vector(1536)) dans PostgreSQL
    │
    ▼
Document prêt pour la recherche sémantique
```

**Service de recherche sémantique :**

```typescript
async rechercherSemantique(
  requete: string,
  userId: string,
  ueId?: string,
  limit = 10
): Promise<RessourceAvecScore[]> {
  const queryVector = await this.embeddingService.embed(requete);

  const sql = `
    SELECT r.*, 1 - (e.vecteur <=> $1) AS score
    FROM embedding e
    JOIN chunk c ON c.id = e.chunk_id
    JOIN ressource r ON r.id = c.ressource_id
    WHERE (
      r.niveau_acces = 'PUBLIC'
      OR (r.niveau_acces = 'CAMPUS' AND $2 IS NOT NULL)
      OR (r.niveau_acces = 'PRIVE' AND r.proprietaire_id = $2)
    )
    ${ueId ? 'AND EXISTS (SELECT 1 FROM ressource_ue ru WHERE ru.ressource_id = r.id AND ru.ue_id = $3)' : ''}
    ORDER BY score DESC
    LIMIT $${ueId ? 4 : 3}
  `;

  return this.dataSource.query(sql, [queryVector, userId, ...(ueId ? [ueId] : []), limit]);
}
```

**Endpoints RAG :**

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/rag/index/:ressource_id` | Indexer une ressource |
| POST | `/rag/search` | Recherche sémantique |
| POST | `/rag/ask` | Question RAG (LLM + contexte) |
| GET | `/rag/status/:ressource_id` | Statut d'indexation |

**Livrables :**
- [ ] Extraction texte PDF (pdf-parse ou pdf2pic + OCR)
- [ ] Chunks stockés en base avec position page
- [ ] Embeddings générés et stockés (pgvector)
- [ ] Recherche cosinus opérationnelle
- [ ] Endpoint `/rag/ask` avec réponse contextuelle

---

### Phase 6 — Module Prolog (Semaine 9)

**Objectifs :** classification automatique, recommandations, raisonnement sur les prérequis

#### 6.1 Architecture du pont NestJS ↔ Prolog

```
NestJS PrologBridgeService
    │
    │  HTTP POST /prolog/query
    ▼
SWI-Prolog HTTP Server (port 8081)
    │  handle_query(Goal, Result)
    ▼
Base de faits (.pl) + Moteur d'inférence
```

**NestJS — PrologBridgeService :**

```typescript
@Injectable()
export class PrologBridgeService {
  constructor(private readonly httpService: HttpService) {}

  async query(goal: string): Promise<PrologResult[]> {
    const response = await this.httpService.post(
      'http://prolog:8081/query',
      { goal }
    ).toPromise();
    return response.data.solutions;
  }

  async classifierDocument(titre: string, motsCles: string[]): Promise<string[]> {
    const goal = `classifier_document("${titre}", [${motsCles.map(m => `"${m}"`).join(',')}], Types)`;
    const results = await this.query(goal);
    return results.map(r => r['Types']);
  }

  async getPrerequisites(ueCode: string): Promise<string[]> {
    const results = await this.query(`prerequis_chemin("${ueCode}", Chemin)`);
    return results[0]?.['Chemin'] ?? [];
  }

  async recommander(ressourceId: string): Promise<string[]> {
    const results = await this.query(`recommande("${ressourceId}", Recommandations)`);
    return results[0]?.['Recommandations'] ?? [];
  }
}
```

#### 6.2 Base de connaissances Prolog (`acadoc.pl`)

```prolog
%% ============================================================
%% ACADOC.PL — Base de connaissances académique
%% ============================================================

:- use_module(library(http/thread_httpd)).
:- use_module(library(http/http_dispatch)).
:- use_module(library(http/http_json)).

%% -----------------------------------------------------------
%% 1. CLASSIFICATION AUTOMATIQUE PAR MOTS-CLÉS
%% -----------------------------------------------------------

mot_cle_type("TCP/IP",        reseau).
mot_cle_type("OSPF",          reseau).
mot_cle_type("routage",       reseau).
mot_cle_type("socket",        reseau).
mot_cle_type("gradient",      machine_learning).
mot_cle_type("backpropagation", machine_learning).
mot_cle_type("réseau de neurones", deep_learning).
mot_cle_type("transformer",   deep_learning).
mot_cle_type("probabilité",   mathematiques).
mot_cle_type("loi normale",   mathematiques).
mot_cle_type("SQL",           bases_de_donnees).
mot_cle_type("jointure",      bases_de_donnees).
mot_cle_type("normalisation", bases_de_donnees).

classifier_document(_, MotsCles, Types) :-
    findall(T, (
        member(MC, MotsCles),
        mot_cle_type(MC, T)
    ), TypesList),
    list_to_set(TypesList, Types).

%% -----------------------------------------------------------
%% 2. PRÉREQUIS ACADÉMIQUES
%% -----------------------------------------------------------

prerequis("Deep Learning",       "Machine Learning").
prerequis("Machine Learning",    "Probabilités et Statistiques").
prerequis("Probabilités et Statistiques", "Analyse Mathématique").
prerequis("Réseaux Avancés",     "Réseaux Informatiques").
prerequis("Réseaux Informatiques", "Architecture des Ordinateurs").
prerequis("Bases de données avancées", "Bases de données").
prerequis("Bases de données",    "Algorithmique").

%% Prérequis transitifs (fermeture transitive)
prerequis_transitif(A, B) :- prerequis(A, B).
prerequis_transitif(A, C) :-
    prerequis(A, B),
    prerequis_transitif(B, C).

%% Chemin ordonné de prérequis
prerequis_chemin(UE, Chemin) :-
    findall(P, prerequis_transitif(UE, P), ListePrereq),
    list_to_set(ListePrereq, Chemin).

%% -----------------------------------------------------------
%% 3. RECOMMANDATIONS PAR UE
%% -----------------------------------------------------------

meme_ue(Doc1, Doc2) :-
    document_ue(Doc1, UE),
    document_ue(Doc2, UE),
    Doc1 \= Doc2.

meme_type(Doc1, Doc2) :-
    document_type(Doc1, T),
    document_type(Doc2, T),
    Doc1 \= Doc2.

recommande(Doc, Recommandations) :-
    findall(D, meme_ue(Doc, D), ParUE),
    findall(D, meme_type(Doc, D), ParType),
    append(ParUE, ParType, Tous),
    list_to_set(Tous, Recommandations).

%% -----------------------------------------------------------
%% 4. COHÉRENCE PÉDAGOGIQUE
%% -----------------------------------------------------------

%% Vérifier si un étudiant a les prérequis pour une UE
peut_suivre(Etudiant, UE) :-
    findall(P, prerequis(UE, P), Prereqs),
    forall(member(P, Prereqs), a_valide(Etudiant, P)).

%% -----------------------------------------------------------
%% 5. SERVEUR HTTP (pont NestJS)
%% -----------------------------------------------------------

:- http_handler('/query', handle_query, []).

handle_query(Request) :-
    http_read_json_dict(Request, Data),
    Goal = Data.goal,
    term_to_atom(T, Goal),
    findall(Sol, call(T), Solutions),
    reply_json_dict(_{solutions: Solutions}).

server(Port) :-
    http_server(http_dispatch, [port(Port)]).

:- initialization(server(8080), main).
```

**NestJS — Intégration dans le module Ressource :**

```typescript
// Après création d'une ressource, classification automatique
async afterCreate(ressource: Ressource): Promise<void> {
  const motsCles = ressource.mot_cles.map(mc => mc.libelle);
  const types = await this.prologService.classifierDocument(
    ressource.titre,
    motsCles
  );
  // Assigner les thématiques suggérées
  for (const type of types) {
    await this.thematiqueService.associer(ressource.id, type, 'PROLOG');
  }
}
```

**Livrables :**
- [ ] Serveur SWI-Prolog HTTP démarrant avec Docker
- [ ] `PrologBridgeService` NestJS fonctionnel
- [ ] Classification automatique à la création d'une ressource
- [ ] Endpoint `/ressources/:id/prerequis` renvoyant le chemin Prolog
- [ ] Endpoint `/ressources/:id/recommandations`

---

### Phase 7 — React Native (Semaines 10–12)

**Objectifs :** application mobile complète

#### Structure de l'application

```
mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/
│   │   ├── explorer.tsx          # Navigation Fac → UE
│   │   ├── search.tsx            # Recherche + RAG
│   │   ├── favoris.tsx
│   │   └── profil.tsx
│   └── ressource/
│       ├── [id].tsx              # Détail ressource
│       └── upload.tsx            # Dépôt document
├── components/
│   ├── RessourceCard.tsx
│   ├── UEBreadcrumb.tsx
│   ├── NiveauAccesBadge.tsx
│   ├── TypeDocumentBadge.tsx
│   └── RAGChat.tsx               # Interface question/réponse
├── hooks/
│   ├── useRessources.ts          # React Query
│   ├── useOrganisation.ts
│   └── useRAG.ts
└── services/
    ├── api.ts                    # Axios instance + interceptors
    ├── auth.service.ts
    └── storage.service.ts        # SecureStore JWT
```

#### Écrans principaux

**1. Explorateur (navigation hiérarchique) :**

```tsx
// app/(tabs)/explorer.tsx
export default function ExplorerScreen() {
  const [selectedFaculte, setSelectedFaculte] = useState<string | null>(null);
  const [selectedFormation, setSelectedFormation] = useState<string | null>(null);

  const { data: facultes } = useFacultes();
  const { data: ues } = useUEs(selectedFormation);

  return (
    <View>
      {/* Breadcrumb : Informatique > L3 > Réseaux */}
      <UEBreadcrumb faculte={selectedFaculte} formation={selectedFormation} />

      {/* Liste des UEs */}
      <FlatList
        data={ues}
        renderItem={({ item }) => (
          <UECard
            ue={item}
            onPress={() => navigation.navigate('ressource-list', { ueId: item.id })}
          />
        )}
      />
    </View>
  );
}
```

**2. Recherche + Chat RAG :**

```tsx
// components/RAGChat.tsx
export function RAGChat({ ueId }: { ueId?: string }) {
  const [query, setQuery] = useState('');
  const { mutate: ask, data: response } = useRAGAsk();

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Explique-moi le routage OSPF..."
      />
      <Button title="Demander" onPress={() => ask({ query, ueId })} />
      {response && (
        <View>
          <Text>{response.answer}</Text>
          <Text style={styles.sources}>
            Sources : {response.sources.map(s => s.titre).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
}
```

**3. Badge de niveau d'accès :**

```tsx
const COLORS = {
  PUBLIC: '#22c55e',
  CAMPUS: '#3b82f6',
  PRIVE:  '#f59e0b',
};

export function NiveauAccesBadge({ niveau }: { niveau: NiveauAcces }) {
  return (
    <View style={[styles.badge, { backgroundColor: COLORS[niveau] }]}>
      <Text style={styles.label}>{niveau}</Text>
    </View>
  );
}
```

**Livrables :**
- [ ] Navigation Expo Router opérationnelle
- [ ] Explorateur hiérarchique Faculté → UE → Ressources
- [ ] Recherche plein-texte + sémantique
- [ ] Chat RAG avec citation des sources
- [ ] Upload PDF depuis le mobile
- [ ] Gestion des favoris
- [ ] Affichage conditionnel selon niveau_acces

---

## 5. API REST — Endpoints complets

### Auth

```
POST   /auth/register
POST   /auth/login
GET    /auth/me
POST   /auth/refresh
```

### Organisation académique

```
GET    /facultes
POST   /facultes                    [ADMIN]
GET    /facultes/:id
GET    /facultes/:id/departements

GET    /departements/:id
GET    /departements/:id/formations

GET    /formations/:id
GET    /formations/:id/ues

GET    /ues
GET    /ues/:id
GET    /ues/:id/ressources          ?type=COURS&annee=2025
POST   /ues                         [ADMIN]
```

### Ressources

```
GET    /ressources                  ?categorie=&type=&ue=&q=&page=
POST   /ressources                  [AUTH]
GET    /ressources/:id
PATCH  /ressources/:id              [OWNER|ADMIN]
DELETE /ressources/:id              [OWNER|ADMIN]
GET    /ressources/:id/prerequis    → Prolog
GET    /ressources/:id/recommandations → Prolog
```

### Fichiers

```
POST   /ressources/:id/fichiers     [OWNER] (multipart)
GET    /fichiers/:id/download       → URL présignée MinIO
DELETE /fichiers/:id                [OWNER|ADMIN]
```

### RAG

```
POST   /rag/index/:ressource_id     [ADMIN|OWNER]
POST   /rag/search                  { query, ue_id?, limit? }
POST   /rag/ask                     { question, ue_id?, contexte? }
GET    /rag/status/:ressource_id
```

### Usage

```
GET    /favoris                     [AUTH]
POST   /favoris/:ressource_id       [AUTH]
DELETE /favoris/:ressource_id       [AUTH]
GET    /historique/consultations    [AUTH]
GET    /historique/telechargements  [AUTH]
```

---

## 6. Module Prolog

### Cas d'usage

| Cas | Entrée | Sortie |
|-----|--------|--------|
| Classification | titre + mots-clés | thématiques suggérées |
| Prérequis | code UE | liste ordonnée des UEs prérequises |
| Recommandation | id ressource | liste d'autres ressources liées |
| Cohérence | étudiant + UE | peut_suivre(true/false) + raison |

### Exemple de requête depuis NestJS

```typescript
// GET /ressources/:id/prerequis
async getPrerequisPourUE(ueCode: string) {
  const chemin = await this.prologService.getPrerequisites(ueCode);
  // chemin = ["Machine Learning", "Probabilités", "Analyse Mathématique"]
  return {
    ue: ueCode,
    prerequis_ordonnes: chemin,
    message: `Avant "${ueCode}", vous devez maîtriser : ${chemin.join(' → ')}`
  };
}
```

---

## 7. Module RAG

### Pipeline complet

```
1. Upload PDF
        ↓
2. Extraction texte (pdf-parse)
        ↓
3. Nettoyage / segmentation
        ↓
4. Chunks (512 tokens, overlap 50 tokens)
        ↓
5. Embeddings OpenAI text-embedding-3-small (dim=1536)
        ↓
6. Stockage pgvector
        ↓
7. Question utilisateur → embedding de la question
        ↓
8. Recherche cosinus dans pgvector (top-k=5)
        ↓
9. Récupération des chunks + métadonnées ressources
        ↓
10. Prompt LLM : "Réponds à la question en te basant sur ces extraits : ..."
        ↓
11. Réponse + citations (titre, page, UE)
```

### Prompt système RAG

```
Tu es un assistant pédagogique de l'université.
Tu réponds uniquement à partir des documents fournis.
Pour chaque information, cite la source (titre du document, page).
Si la réponse ne se trouve pas dans les documents, dis-le clairement.

Contexte (documents de l'université) :
{chunks_contexte}

Question de l'étudiant :
{question}
```

---

## 8. Application React Native

### Dépendances principales

```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "react-query": "^5.0.0",
  "axios": "^1.6.0",
  "expo-secure-store": "~14.0.0",
  "expo-document-picker": "~12.0.0",
  "expo-file-system": "~17.0.0",
  "@shopify/flash-list": "^1.6.0"
}
```

### Gestion d'état & requêtes

```typescript
// hooks/useRessources.ts
export function useRessourcesParUE(ueId: string) {
  return useQuery({
    queryKey: ['ressources', 'ue', ueId],
    queryFn: () => api.get(`/ues/${ueId}/ressources`).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useRAGAsk() {
  return useMutation({
    mutationFn: (payload: { question: string; ue_id?: string }) =>
      api.post('/rag/ask', payload).then(r => r.data),
  });
}
```

---

## 9. Schéma de déploiement

```
Production (VPS / Cloud)
├── nginx (reverse proxy)
│   ├── → :3000 NestJS API
│   └── → :9001 MinIO Console
├── NestJS (PM2 ou Docker)
├── PostgreSQL 16 + pgvector
├── MinIO (stockage objet)
└── SWI-Prolog HTTP server

Développement (local)
└── docker-compose up
    ├── postgres:5432
    ├── minio:9000 + 9001
    └── prolog:8081
```

### Variables d'environnement

```env
# Base de données
DATABASE_URL=postgresql://acadoc:secret@localhost:5432/acadoc

# JWT
JWT_SECRET=super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=documents

# IA / RAG
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-small
LLM_MODEL=gpt-4o-mini

# Prolog
PROLOG_URL=http://localhost:8081
```

---

## Récapitulatif des phases

| Phase | Contenu | Durée | Priorité |
|-------|---------|-------|----------|
| 0 | Infrastructure, Docker, CI | Sem. 1 | Critique |
| 1 | Auth, JWT, Rôles | Sem. 2 | Critique |
| 2 | Organisation académique | Sem. 3 | Haute |
| 3 | Module Ressource + ACL | Sem. 4–5 | Haute |
| 4 | Upload MinIO | Sem. 6 | Haute |
| 5 | RAG (Chunk + Embedding) | Sem. 7–8 | Moyenne |
| 6 | Prolog (Classification + Prereqs) | Sem. 9 | Moyenne |
| 7 | React Native | Sem. 10–12 | Haute |

---

*Document généré le 3 juin 2026*
