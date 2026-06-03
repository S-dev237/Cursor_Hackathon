import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint


class FaculteModel(SQLModel, table=True):
    __tablename__ = "faculte"
    __table_args__ = {"schema": "academique"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    nom: str = Field(max_length=200)
    code: str = Field(max_length=20, unique=True)
    description: Optional[str] = None


class DepartementModel(SQLModel, table=True):
    __tablename__ = "departement"
    __table_args__ = {"schema": "academique"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    nom: str = Field(max_length=200)
    code: str = Field(max_length=20, unique=True)
    description: Optional[str] = None
    faculte_id: uuid.UUID = Field(foreign_key="academique.faculte.id")


class FormationModel(SQLModel, table=True):
    __tablename__ = "formation"
    __table_args__ = {"schema": "academique"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    nom: str = Field(max_length=200)
    code: str = Field(max_length=20, unique=True)
    niveau: str = Field(max_length=5)  # L1..D
    description: Optional[str] = None
    departement_id: uuid.UUID = Field(foreign_key="academique.departement.id")


class UEModel(SQLModel, table=True):
    __tablename__ = "ue"
    __table_args__ = (
        UniqueConstraint("code", name="uq_academique_ue_code"),
        {"schema": "academique"},
    )
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    code: str = Field(max_length=20)
    nom: str = Field(max_length=300)
    semestre: str = Field(max_length=5)
    credits: Optional[int] = None
    description: Optional[str] = None
    formation_id: uuid.UUID = Field(foreign_key="academique.formation.id")
