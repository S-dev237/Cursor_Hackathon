import uuid
from typing import Optional
from sqlmodel import SQLModel, Field


class ChunkModel(SQLModel, table=True):
    """Stocke les métadonnées des chunks (vecteurs dans LanceDB)."""
    __tablename__ = "chunk"
    __table_args__ = {"schema": "rag"}
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ressource_id: uuid.UUID = Field(foreign_key="document.ressource.id")
    contenu: str
    indice: int
    taille_tokens: Optional[int] = None
    vecteur_id: Optional[str] = Field(default=None, max_length=100)
    modele_embedding: str = Field(default="text-embedding-3-small", max_length=100)
