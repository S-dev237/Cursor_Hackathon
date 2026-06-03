from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import uuid


class ConsultationCreate(BaseModel):
    ressource_id: uuid.UUID
    duree_secondes: Optional[int] = None


class FavoriResponse(BaseModel):
    utilisateur_id: uuid.UUID
    ressource_id: uuid.UUID
    created_at: datetime


class StatsRessourceResponse(BaseModel):
    ressource_id: uuid.UUID
    nb_consultations: int
    nb_telechargements: int
