import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint


class ThematiqueModel(SQLModel, table=True):
    __tablename__ = "thematique"
    __table_args__ = {"schema": "classification"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(max_length=50, unique=True)
    libelle: str = Field(max_length=300)
    parent_id: Optional[uuid.UUID] = Field(default=None, foreign_key="classification.thematique.id")


class MotCleModel(SQLModel, table=True):
    __tablename__ = "mot_cle"
    __table_args__ = {"schema": "classification"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    terme: str = Field(max_length=200, unique=True)


class RessourceThematiqueModel(SQLModel, table=True):
    __tablename__ = "ressource_thematique"
    __table_args__ = {"schema": "classification"}
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id", primary_key=True)
    thematique_id: uuid.UUID = Field(foreign_key="classification.thematique.id", primary_key=True)
    origine: str = Field(max_length=20, default="MANUELLE")  # MANUELLE | PROLOG | IA


class RessourceMotCleModel(SQLModel, table=True):
    __tablename__ = "ressource_mot_cle"
    __table_args__ = {"schema": "classification"}
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id", primary_key=True)
    mot_cle_id: uuid.UUID = Field(foreign_key="classification.mot_cle.id", primary_key=True)


class DossierVirtuelModel(SQLModel, table=True):
    """
    Dossier virtuel d'organisation multi-vues. Aucun fichier n'est dupliqué :
    seules les classifications changent. Un dossier est identifié de façon
    unique par le couple (axe, code).
    """
    __tablename__ = "dossier_virtuel"
    __table_args__ = (
        UniqueConstraint("axe", "code", name="uq_dossier_axe_code"),
        {"schema": "classification"},
    )
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    axe: str = Field(max_length=20, index=True)   # DISCIPLINE | DOMAINE | ANNEE | AUTEUR | LABORATOIRE
    code: str = Field(max_length=120, index=True)
    nom: str = Field(max_length=200)


class DocumentDossierModel(SQLModel, table=True):
    """
    Rattachement N..N d'une ressource à un dossier virtuel. Un même document
    peut appartenir simultanément à plusieurs dossiers (IA, Santé, 2026…).
    `origine` ∈ { MANUELLE, PROLOG, IA }.
    """
    __tablename__ = "document_dossier"
    __table_args__ = {"schema": "classification"}
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id", primary_key=True)
    dossier_id: uuid.UUID = Field(foreign_key="classification.dossier_virtuel.id", primary_key=True)
    origine: str = Field(max_length=20, default="PROLOG")
