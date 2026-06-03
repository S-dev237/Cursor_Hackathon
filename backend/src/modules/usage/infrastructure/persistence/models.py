import uuid
from typing import Optional
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import func


class ConsultationModel(SQLModel, table=True):
    __tablename__ = "consultation"
    __table_args__ = {"schema": "usage"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id")
    utilisateur_id: Optional[uuid.UUID] = Field(default=None, foreign_key="iam.utilisateur.id")
    duree_secondes: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class TelechargementModel(SQLModel, table=True):
    __tablename__ = "telechargement"
    __table_args__ = {"schema": "usage"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id")
    utilisateur_id: Optional[uuid.UUID] = Field(default=None, foreign_key="iam.utilisateur.id")
    fichier_id: uuid.UUID = Field(foreign_key="document.fichier.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class FavoriModel(SQLModel, table=True):
    __tablename__ = "favori"
    __table_args__ = {"schema": "usage"}
    utilisateur_id: uuid.UUID = Field(foreign_key="iam.utilisateur.id", primary_key=True)
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id", primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
