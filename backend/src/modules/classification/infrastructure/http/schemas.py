from typing import Optional, List
from pydantic import BaseModel
import uuid


class ThematiqueResponse(BaseModel):
    id: uuid.UUID
    code: str
    libelle: str
    parent_id: Optional[uuid.UUID] = None


class MotCleResponse(BaseModel):
    id: uuid.UUID
    terme: str


class ClassifierRequest(BaseModel):
    ressource_id: str
    titre: str
    mots_cles: List[str] = []


class PrerequisResponse(BaseModel):
    ue_code: str
    prerequis: List[str]


# ── Organisation multi-vues / dossiers virtuels ────────────────────────────
class AxeResponse(BaseModel):
    axe: str
    libelle: str
    nb_dossiers: int
    nb_documents: int


class DossierResponse(BaseModel):
    id: uuid.UUID
    axe: str
    code: str
    nom: str
    nb_documents: int


class RessourceLite(BaseModel):
    id: uuid.UUID
    titre: str
    type_document: str
    categorie: str
    niveau_acces: str
    annee: Optional[int] = None
    publiee: bool = False
    proprietaire_id: uuid.UUID


class DossierDetailResponse(BaseModel):
    id: uuid.UUID
    axe: str
    code: str
    nom: str
    ressources: List[RessourceLite]


class DossierRessourceResponse(BaseModel):
    """Un dossier virtuel auquel une ressource est rattachée (vue multi-axes)."""
    id: uuid.UUID
    axe: str
    libelle_axe: str
    code: str
    nom: str
    origine: str


class OrganiserResponse(BaseModel):
    ressource_id: uuid.UUID
    mots_cles: List[str]
    dossiers: List[DossierRessourceResponse]
