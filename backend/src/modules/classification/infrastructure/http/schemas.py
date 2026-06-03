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
