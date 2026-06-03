import uuid
from typing import Optional
from sqlmodel import SQLModel, Field


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
