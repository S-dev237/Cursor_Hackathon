from typing import Optional, Literal, List
from pydantic import BaseModel
import uuid

NiveauAcces = Literal["PUBLIC", "CAMPUS", "PRIVE"]
TypeDocument = Literal[
    "COURS", "TD", "TP", "EXAMEN", "CORRECTION", "SUPPORT",
    "MEMOIRE", "THESE", "ARTICLE", "RAPPORT", "AUTRE"
]


class RessourceCreate(BaseModel):
    titre: str
    type_document: TypeDocument
    niveau_acces: NiveauAcces = "CAMPUS"
    annee: Optional[int] = None
    description: Optional[str] = None
    ue_ids: List[uuid.UUID] = []


class RessourceResponse(BaseModel):
    id: uuid.UUID
    titre: str
    type_document: str
    categorie: str
    niveau_acces: str
    annee: Optional[int] = None
    description: Optional[str] = None
    publiee: bool
    doi: Optional[str] = None
    proprietaire_id: uuid.UUID


class FichierResponse(BaseModel):
    id: uuid.UUID
    nom_original: str
    taille_octets: int
    type_mime: str
    minio_key: str


class PresignedUrlResponse(BaseModel):
    url: str
    expires_in: int = 3600
