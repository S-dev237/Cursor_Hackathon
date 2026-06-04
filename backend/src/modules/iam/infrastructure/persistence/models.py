import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field, Column, DateTime
from sqlalchemy import UniqueConstraint


class UtilisateurModel(SQLModel, table=True):
    __tablename__ = "utilisateur"
    __table_args__ = (
        UniqueConstraint("email", name="uq_iam_utilisateur_email"),
        {"schema": "iam"},
    )
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(max_length=320)
    mot_de_passe_hash: str = Field(max_length=255)
    type: str = Field(max_length=20)  # ETUDIANT | ENSEIGNANT | ADMIN
    nom: Optional[str] = Field(default=None, max_length=200)
    prenom: Optional[str] = Field(default=None, max_length=200)
    nom_complet: Optional[str] = Field(default=None, max_length=400)
    institution_id: Optional[str] = Field(default=None, max_length=100)
    actif: bool = Field(default=True)
    cree_le: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=False),
    )
    derniere_connexion: Optional[datetime] = Field(
        default=None,
        sa_column=Column(DateTime(timezone=True), nullable=True),
    )


class RoleModel(SQLModel, table=True):
    __tablename__ = "role"
    __table_args__ = {"schema": "iam"}
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(max_length=50, unique=True)
    description: Optional[str] = None


class UtilisateurRoleModel(SQLModel, table=True):
    __tablename__ = "utilisateur_role"
    __table_args__ = {"schema": "iam"}
    utilisateur_id: uuid.UUID = Field(foreign_key="iam.utilisateur.id", primary_key=True)
    role_id: int = Field(foreign_key="iam.role.id", primary_key=True)
