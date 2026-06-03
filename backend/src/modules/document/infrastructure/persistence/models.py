import uuid
from typing import Optional
from sqlmodel import SQLModel, Field
from sqlalchemy import text


class RessourceModel(SQLModel, table=True):
    __tablename__ = "ressource"
    __table_args__ = {"schema": "document"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    titre: str = Field(max_length=500)
    type_document: str = Field(max_length=30)
    categorie: str = Field(max_length=30)
    niveau_acces: str = Field(max_length=10, default="CAMPUS")
    annee: Optional[int] = None
    description: Optional[str] = None
    publiee: bool = Field(default=False)
    doi: Optional[str] = Field(default=None, max_length=200)
    proprietaire_id: uuid.UUID = Field(foreign_key="iam.utilisateur.id")


class FichierModel(SQLModel, table=True):
    __tablename__ = "fichier"
    __table_args__ = {"schema": "document"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id")
    minio_bucket: str = Field(max_length=100)
    minio_key: str = Field(max_length=500)
    nom_original: str = Field(max_length=500)
    taille_octets: int
    type_mime: str = Field(max_length=100, default="application/pdf")
    checksum_sha256: Optional[str] = Field(default=None, max_length=64)


class AuteurModel(SQLModel, table=True):
    __tablename__ = "auteur"
    __table_args__ = {"schema": "document"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    nom: str = Field(max_length=200)
    prenom: str = Field(max_length=200)
    email: Optional[str] = Field(default=None, max_length=320)
    affiliation: Optional[str] = Field(default=None, max_length=300)
    orcid: Optional[str] = Field(default=None, max_length=50)


class RessourceAuteurModel(SQLModel, table=True):
    __tablename__ = "ressource_auteur"
    __table_args__ = {"schema": "document"}
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id", primary_key=True)
    auteur_id: uuid.UUID = Field(foreign_key="document.auteur.id", primary_key=True)
    ordre: int = Field(default=1)


class RessourceUEModel(SQLModel, table=True):
    __tablename__ = "ressource_ue"
    __table_args__ = {"schema": "document"}
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id", primary_key=True)
    ue_id: uuid.UUID = Field(foreign_key="academique.ue.id", primary_key=True)
