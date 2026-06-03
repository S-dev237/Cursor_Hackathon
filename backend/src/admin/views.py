"""
Vues SQLAdmin — une ModelView par table SQLModel.
Organisées par Bounded Context avec des icônes et catégories.
"""
from sqladmin import ModelView

# ── IAM ───────────────────────────────────────────────────────────────────────
from src.modules.iam.infrastructure.persistence.models import (
    UtilisateurModel, RoleModel, UtilisateurRoleModel
)

# ── Académique ────────────────────────────────────────────────────────────────
from src.modules.academique.infrastructure.persistence.models import (
    FaculteModel, DepartementModel, FormationModel, UEModel
)

# ── Document ──────────────────────────────────────────────────────────────────
from src.modules.document.infrastructure.persistence.models import (
    RessourceModel, FichierModel, AuteurModel,
    RessourceAuteurModel, RessourceUEModel
)

# ── Classification ────────────────────────────────────────────────────────────
from src.modules.classification.infrastructure.persistence.models import (
    ThematiqueModel, MotCleModel,
    RessourceThematiqueModel, RessourceMotCleModel
)

# ── RAG ───────────────────────────────────────────────────────────────────────
from src.modules.rag.infrastructure.persistence.models import ChunkModel

# ── Usage ─────────────────────────────────────────────────────────────────────
from src.modules.usage.infrastructure.persistence.models import (
    ConsultationModel, TelechargementModel, FavoriModel
)


# =============================================================================
# IAM
# =============================================================================

class UtilisateurAdmin(ModelView, model=UtilisateurModel):
    name = "Utilisateur"
    name_plural = "Utilisateurs"
    icon = "fa-solid fa-users"
    category = "IAM"

    column_list = [
        UtilisateurModel.id,
        UtilisateurModel.email,
        UtilisateurModel.type,
        UtilisateurModel.nom,
        UtilisateurModel.prenom,
        UtilisateurModel.actif,
    ]
    column_searchable_list = [UtilisateurModel.email, UtilisateurModel.nom]
    column_sortable_list = [UtilisateurModel.email, UtilisateurModel.type, UtilisateurModel.actif]
    column_filters = [UtilisateurModel.type, UtilisateurModel.actif]

    # Ne jamais exposer le hash en liste
    column_details_exclude_list = [UtilisateurModel.mot_de_passe_hash]
    form_excluded_columns = [UtilisateurModel.mot_de_passe_hash]

    can_create = False  # Création via l'API /auth/inscrire
    can_delete = True
    can_edit = True
    can_export = True
    export_types = ["csv", "json"]
    page_size = 25


class RoleAdmin(ModelView, model=RoleModel):
    name = "Rôle"
    name_plural = "Rôles"
    icon = "fa-solid fa-shield-halved"
    category = "IAM"

    column_list = [RoleModel.id, RoleModel.code, RoleModel.description]
    column_searchable_list = [RoleModel.code]


class UtilisateurRoleAdmin(ModelView, model=UtilisateurRoleModel):
    name = "Attribution de rôle"
    name_plural = "Attributions de rôles"
    icon = "fa-solid fa-user-tag"
    category = "IAM"

    column_list = [UtilisateurRoleModel.utilisateur_id, UtilisateurRoleModel.role_id]


# =============================================================================
# Académique
# =============================================================================

class FaculteAdmin(ModelView, model=FaculteModel):
    name = "Faculté"
    name_plural = "Facultés"
    icon = "fa-solid fa-university"
    category = "Académique"

    column_list = [FaculteModel.id, FaculteModel.code, FaculteModel.nom, FaculteModel.description]
    column_searchable_list = [FaculteModel.nom, FaculteModel.code]
    column_sortable_list = [FaculteModel.code, FaculteModel.nom]


class DepartementAdmin(ModelView, model=DepartementModel):
    name = "Département"
    name_plural = "Départements"
    icon = "fa-solid fa-building-columns"
    category = "Académique"

    column_list = [
        DepartementModel.id, DepartementModel.code,
        DepartementModel.nom, DepartementModel.faculte_id
    ]
    column_searchable_list = [DepartementModel.nom, DepartementModel.code]
    column_sortable_list = [DepartementModel.code]


class FormationAdmin(ModelView, model=FormationModel):
    name = "Formation"
    name_plural = "Formations"
    icon = "fa-solid fa-graduation-cap"
    category = "Académique"

    column_list = [
        FormationModel.id, FormationModel.code, FormationModel.nom,
        FormationModel.niveau, FormationModel.departement_id
    ]
    column_searchable_list = [FormationModel.nom, FormationModel.code]
    column_sortable_list = [FormationModel.niveau, FormationModel.code]
    column_filters = [FormationModel.niveau]


class UEAdmin(ModelView, model=UEModel):
    name = "Unité d'Enseignement"
    name_plural = "Unités d'Enseignement (UE)"
    icon = "fa-solid fa-book-open"
    category = "Académique"

    column_list = [
        UEModel.id, UEModel.code, UEModel.nom,
        UEModel.semestre, UEModel.credits, UEModel.formation_id
    ]
    column_searchable_list = [UEModel.code, UEModel.nom]
    column_sortable_list = [UEModel.code, UEModel.semestre]
    column_filters = [UEModel.semestre]


# =============================================================================
# Document
# =============================================================================

class RessourceAdmin(ModelView, model=RessourceModel):
    name = "Ressource"
    name_plural = "Ressources documentaires"
    icon = "fa-solid fa-file-lines"
    category = "Document"

    column_list = [
        RessourceModel.id,
        RessourceModel.titre,
        RessourceModel.type_document,
        RessourceModel.categorie,
        RessourceModel.niveau_acces,
        RessourceModel.annee,
        RessourceModel.publiee,
        RessourceModel.proprietaire_id,
    ]
    column_searchable_list = [RessourceModel.titre, RessourceModel.description]
    column_sortable_list = [
        RessourceModel.titre, RessourceModel.type_document,
        RessourceModel.annee, RessourceModel.publiee
    ]
    column_filters = [
        RessourceModel.type_document,
        RessourceModel.categorie,
        RessourceModel.niveau_acces,
        RessourceModel.publiee,
    ]
    can_create = False  # Création via l'API
    can_export = True
    export_types = ["csv", "json"]
    page_size = 30


class FichierAdmin(ModelView, model=FichierModel):
    name = "Fichier"
    name_plural = "Fichiers"
    icon = "fa-solid fa-file-pdf"
    category = "Document"

    column_list = [
        FichierModel.id, FichierModel.nom_original,
        FichierModel.type_mime, FichierModel.taille_octets,
        FichierModel.minio_bucket, FichierModel.minio_key,
        FichierModel.ressource_id,
    ]
    column_searchable_list = [FichierModel.nom_original]
    column_sortable_list = [FichierModel.taille_octets, FichierModel.type_mime]
    can_create = False
    can_edit = False


class AuteurAdmin(ModelView, model=AuteurModel):
    name = "Auteur"
    name_plural = "Auteurs"
    icon = "fa-solid fa-pen-nib"
    category = "Document"

    column_list = [
        AuteurModel.id, AuteurModel.prenom, AuteurModel.nom,
        AuteurModel.email, AuteurModel.affiliation, AuteurModel.orcid
    ]
    column_searchable_list = [AuteurModel.nom, AuteurModel.prenom, AuteurModel.email]
    column_sortable_list = [AuteurModel.nom]


class RessourceAuteurAdmin(ModelView, model=RessourceAuteurModel):
    name = "Ressource ↔ Auteur"
    name_plural = "Liens Ressource-Auteur"
    icon = "fa-solid fa-link"
    category = "Document"

    column_list = [
        RessourceAuteurModel.ressource_id,
        RessourceAuteurModel.auteur_id,
        RessourceAuteurModel.ordre,
    ]
    column_sortable_list = [RessourceAuteurModel.ordre]


class RessourceUEAdmin(ModelView, model=RessourceUEModel):
    name = "Ressource ↔ UE"
    name_plural = "Liens Ressource-UE"
    icon = "fa-solid fa-link"
    category = "Document"

    column_list = [RessourceUEModel.ressource_id, RessourceUEModel.ue_id]


# =============================================================================
# Classification
# =============================================================================

class ThematiqueAdmin(ModelView, model=ThematiqueModel):
    name = "Thématique"
    name_plural = "Thématiques"
    icon = "fa-solid fa-tags"
    category = "Classification"

    column_list = [
        ThematiqueModel.id, ThematiqueModel.code,
        ThematiqueModel.libelle, ThematiqueModel.parent_id
    ]
    column_searchable_list = [ThematiqueModel.code, ThematiqueModel.libelle]
    column_sortable_list = [ThematiqueModel.code]


class MotCleAdmin(ModelView, model=MotCleModel):
    name = "Mot-clé"
    name_plural = "Mots-clés"
    icon = "fa-solid fa-hashtag"
    category = "Classification"

    column_list = [MotCleModel.id, MotCleModel.terme]
    column_searchable_list = [MotCleModel.terme]
    column_sortable_list = [MotCleModel.terme]


class RessourceThematiqueAdmin(ModelView, model=RessourceThematiqueModel):
    name = "Ressource ↔ Thématique"
    name_plural = "Liens Ressource-Thématique"
    icon = "fa-solid fa-diagram-project"
    category = "Classification"

    column_list = [
        RessourceThematiqueModel.ressource_id,
        RessourceThematiqueModel.thematique_id,
        RessourceThematiqueModel.origine,
    ]
    column_filters = [RessourceThematiqueModel.origine]


class RessourceMotCleAdmin(ModelView, model=RessourceMotCleModel):
    name = "Ressource ↔ Mot-clé"
    name_plural = "Liens Ressource-MotClé"
    icon = "fa-solid fa-diagram-project"
    category = "Classification"

    column_list = [RessourceMotCleModel.ressource_id, RessourceMotCleModel.mot_cle_id]


# =============================================================================
# RAG
# =============================================================================

class ChunkAdmin(ModelView, model=ChunkModel):
    name = "Chunk"
    name_plural = "Chunks (RAG)"
    icon = "fa-solid fa-cube"
    category = "RAG"

    column_list = [
        ChunkModel.id, ChunkModel.ressource_id,
        ChunkModel.indice, ChunkModel.taille_tokens,
        ChunkModel.modele_embedding, ChunkModel.vecteur_id,
    ]
    column_searchable_list = [ChunkModel.contenu]
    column_sortable_list = [ChunkModel.indice, ChunkModel.taille_tokens]
    column_filters = [ChunkModel.modele_embedding]

    # Contenu tronqué en liste pour la lisibilité
    column_formatters = {
        ChunkModel.contenu: lambda m, a: (m.contenu[:120] + "…") if len(m.contenu) > 120 else m.contenu
    }
    can_create = False
    can_edit = False
    can_delete = True


# =============================================================================
# Usage
# =============================================================================

class ConsultationAdmin(ModelView, model=ConsultationModel):
    name = "Consultation"
    name_plural = "Consultations"
    icon = "fa-solid fa-eye"
    category = "Usage"

    column_list = [
        ConsultationModel.id, ConsultationModel.ressource_id,
        ConsultationModel.utilisateur_id, ConsultationModel.duree_secondes,
        ConsultationModel.created_at,
    ]
    column_sortable_list = [ConsultationModel.created_at, ConsultationModel.duree_secondes]
    can_create = False
    can_edit = False
    can_export = True
    export_types = ["csv"]


class TelechargementAdmin(ModelView, model=TelechargementModel):
    name = "Téléchargement"
    name_plural = "Téléchargements"
    icon = "fa-solid fa-download"
    category = "Usage"

    column_list = [
        TelechargementModel.id, TelechargementModel.ressource_id,
        TelechargementModel.utilisateur_id, TelechargementModel.fichier_id,
        TelechargementModel.created_at,
    ]
    column_sortable_list = [TelechargementModel.created_at]
    can_create = False
    can_edit = False
    can_export = True
    export_types = ["csv"]


class FavoriAdmin(ModelView, model=FavoriModel):
    name = "Favori"
    name_plural = "Favoris"
    icon = "fa-solid fa-star"
    category = "Usage"

    column_list = [
        FavoriModel.utilisateur_id,
        FavoriModel.ressource_id,
        FavoriModel.created_at,
    ]
    column_sortable_list = [FavoriModel.created_at]
    can_create = False
    can_edit = False


# ── Registre de toutes les vues (ordre d'affichage dans la sidebar) ────────────
ALL_VIEWS = [
    # IAM
    UtilisateurAdmin,
    RoleAdmin,
    UtilisateurRoleAdmin,
    # Académique
    FaculteAdmin,
    DepartementAdmin,
    FormationAdmin,
    UEAdmin,
    # Document
    RessourceAdmin,
    FichierAdmin,
    AuteurAdmin,
    RessourceAuteurAdmin,
    RessourceUEAdmin,
    # Classification
    ThematiqueAdmin,
    MotCleAdmin,
    RessourceThematiqueAdmin,
    RessourceMotCleAdmin,
    # RAG
    ChunkAdmin,
    # Usage
    ConsultationAdmin,
    TelechargementAdmin,
    FavoriAdmin,
]
