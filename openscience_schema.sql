-- ============================================================
--  OpenScience Hub — Schéma PostgreSQL
--  Hackathon J.U.I.N 2026 — Thème 2
--  Généré le : 2026-06-03
-- ============================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
--  DOMAINES ET ÉNUMÉRATIONS
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'researcher', 'admin');
CREATE TYPE doc_type  AS ENUM ('thesis', 'memoir', 'article', 'report');
CREATE TYPE doc_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================
--  TABLE : institutions
-- ============================================================

CREATE TABLE institutions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(200) NOT NULL UNIQUE,
    acronym     VARCHAR(20),
    country     VARCHAR(100) DEFAULT 'Cameroun',
    city        VARCHAR(100),
    website     VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  TABLE : domains (domaines scientifiques)
-- ============================================================

CREATE TABLE domains (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL UNIQUE,
    slug        VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    parent_id   UUID REFERENCES domains(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  TABLE : users
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name       VARCHAR(200) NOT NULL,
    role            user_role NOT NULL DEFAULT 'student',
    institution_id  UUID REFERENCES institutions(id) ON DELETE SET NULL,
    avatar_url      VARCHAR(500),
    bio             TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- ============================================================
--  TABLE : documents
-- ============================================================

CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(500) NOT NULL,
    abstract        TEXT,
    doc_type        doc_type NOT NULL,
    status          doc_status NOT NULL DEFAULT 'pending',

    -- Auteurs
    submitter_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    authors         TEXT[] NOT NULL DEFAULT '{}',   -- noms en clair

    -- Classification
    domain_id       UUID REFERENCES domains(id) ON DELETE SET NULL,
    institution_id  UUID REFERENCES institutions(id) ON DELETE SET NULL,
    keywords        TEXT[] NOT NULL DEFAULT '{}',
    publication_year SMALLINT,

    -- Fichier
    file_path       VARCHAR(500) NOT NULL,
    file_size_kb    INTEGER,
    page_count      INTEGER,

    -- IA
    ai_extracted    BOOLEAN NOT NULL DEFAULT FALSE,
    ai_confidence   NUMERIC(3,2),                   -- score 0.00–1.00

    -- Statistiques
    view_count      INTEGER NOT NULL DEFAULT 0,
    download_count  INTEGER NOT NULL DEFAULT 0,

    -- Validation admin
    reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at     TIMESTAMPTZ,
    rejection_reason TEXT,

    -- Recherche full-text (ts_vector calculé)
    search_vector   TSVECTOR,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index de recherche full-text (GIN)
CREATE INDEX idx_documents_search  ON documents USING GIN(search_vector);
CREATE INDEX idx_documents_status  ON documents(status);
CREATE INDEX idx_documents_type    ON documents(doc_type);
CREATE INDEX idx_documents_year    ON documents(publication_year);
CREATE INDEX idx_documents_domain  ON documents(domain_id);
-- Recherche fuzzy sur le titre (pg_trgm)
CREATE INDEX idx_documents_title_trgm ON documents USING GIN(title gin_trgm_ops);

-- Trigger : mise à jour automatique du search_vector
CREATE OR REPLACE FUNCTION update_document_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('french', coalesce(NEW.title, '')), 'A')  ||
        setweight(to_tsvector('french', coalesce(NEW.abstract, '')), 'B') ||
        setweight(to_tsvector('french', coalesce(array_to_string(NEW.keywords, ' '), '')), 'C') ||
        setweight(to_tsvector('french', coalesce(array_to_string(NEW.authors, ' '), '')), 'D');
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_document_search_vector
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW EXECUTE FUNCTION update_document_search_vector();

-- ============================================================
--  TABLE : citations (formats d'export)
-- ============================================================

CREATE TABLE citations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    bibtex      TEXT,
    apa         TEXT,
    mla         TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_id)
);

-- ============================================================
--  TABLE : document_views (log des consultations)
-- ============================================================

CREATE TABLE document_views (
    id          BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_hash     VARCHAR(64),
    viewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_views_document ON document_views(document_id);

-- ============================================================
--  TABLE : document_downloads
-- ============================================================

CREATE TABLE document_downloads (
    id          BIGSERIAL PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_hash     VARCHAR(64),
    downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_downloads_document ON document_downloads(document_id);

-- ============================================================
--  TABLE : refresh_tokens (auth JWT)
-- ============================================================

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ============================================================
--  DONNÉES INITIALES (seed)
-- ============================================================

-- Institutions
INSERT INTO institutions (name, acronym, city) VALUES
    ('École Nationale Supérieure Polytechnique de Yaoundé', 'ENSPY', 'Yaoundé'),
    ('Université de Yaoundé I', 'UYI', 'Yaoundé'),
    ('Université de Yaoundé II', 'UYII', 'Soa'),
    ('Université de Douala', 'UD', 'Douala'),
    ('Université de Dschang', 'UDs', 'Dschang');

-- Domaines racines
INSERT INTO domains (name, slug) VALUES
    ('Informatique', 'informatique'),
    ('Mathématiques', 'mathematiques'),
    ('Génie Civil', 'genie-civil'),
    ('Sciences Biologiques', 'sciences-biologiques'),
    ('Économie et Gestion', 'economie-gestion'),
    ('Droit', 'droit'),
    ('Médecine', 'medecine'),
    ('Physique', 'physique');

-- Compte admin par défaut (mot de passe : à changer)
-- hashed_password correspond à bcrypt("Admin@2026!")
INSERT INTO users (email, hashed_password, full_name, role) VALUES
    ('admin@openscience.cm',
     '$2b$12$placeholder_hash_change_me',
     'Administrateur OpenScience', 'admin');

-- ============================================================
--  VUES UTILITAIRES
-- ============================================================

-- Vue : documents approuvés avec toutes leurs jointures
CREATE OR REPLACE VIEW v_documents_public AS
SELECT
    d.id,
    d.title,
    d.abstract,
    d.doc_type,
    d.authors,
    d.keywords,
    d.publication_year,
    d.view_count,
    d.download_count,
    d.file_size_kb,
    d.page_count,
    d.ai_extracted,
    d.created_at,
    dom.name   AS domain_name,
    dom.slug   AS domain_slug,
    inst.name  AS institution_name,
    inst.acronym AS institution_acronym,
    u.full_name AS submitter_name
FROM documents d
LEFT JOIN domains      dom  ON d.domain_id      = dom.id
LEFT JOIN institutions inst ON d.institution_id = inst.id
LEFT JOIN users        u    ON d.submitter_id   = u.id
WHERE d.status = 'approved';

-- Vue : statistiques globales (dashboard homepage)
CREATE OR REPLACE VIEW v_stats AS
SELECT
    (SELECT COUNT(*) FROM documents WHERE status = 'approved')  AS total_documents,
    (SELECT COUNT(*) FROM users WHERE role != 'admin')          AS total_users,
    (SELECT COUNT(*) FROM institutions)                         AS total_institutions,
    (SELECT COALESCE(SUM(download_count), 0) FROM documents)   AS total_downloads,
    (SELECT COUNT(*) FROM documents WHERE status = 'pending')   AS pending_reviews;
