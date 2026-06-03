from typing import Optional, Literal
from pydantic import BaseModel
import uuid

Semestre = Literal["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"]
NiveauFormation = Literal["L1", "L2", "L3", "M1", "M2", "D"]


class FaculteCreate(BaseModel):
    nom: str
    code: str
    description: Optional[str] = None


class FaculteResponse(BaseModel):
    id: uuid.UUID
    nom: str
    code: str
    description: Optional[str] = None


class DepartementCreate(BaseModel):
    nom: str
    code: str
    faculte_id: uuid.UUID
    description: Optional[str] = None


class DepartementResponse(BaseModel):
    id: uuid.UUID
    nom: str
    code: str
    faculte_id: uuid.UUID
    description: Optional[str] = None


class FormationCreate(BaseModel):
    nom: str
    code: str
    niveau: NiveauFormation
    departement_id: uuid.UUID
    description: Optional[str] = None


class FormationResponse(BaseModel):
    id: uuid.UUID
    nom: str
    code: str
    niveau: str
    departement_id: uuid.UUID
    description: Optional[str] = None


class UECreate(BaseModel):
    code: str
    nom: str
    semestre: Semestre
    formation_id: uuid.UUID
    credits: Optional[int] = None
    description: Optional[str] = None


class UEResponse(BaseModel):
    id: uuid.UUID
    code: str
    nom: str
    semestre: str
    formation_id: uuid.UUID
    credits: Optional[int] = None
    description: Optional[str] = None
