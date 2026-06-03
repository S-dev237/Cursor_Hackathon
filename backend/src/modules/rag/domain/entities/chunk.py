from __future__ import annotations
import uuid
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Chunk:
    id: uuid.UUID
    ressource_id: uuid.UUID
    contenu: str
    indice: int                     # Position du chunk dans le document
    taille_tokens: Optional[int] = None
    vecteur_id: Optional[str] = None  # Référence vers LanceDB
    modele_embedding: str = "text-embedding-3-small"

    @classmethod
    def creer(
        cls,
        ressource_id: uuid.UUID,
        contenu: str,
        indice: int,
        modele_embedding: str = "text-embedding-3-small",
    ) -> "Chunk":
        return cls(
            id=uuid.uuid4(),
            ressource_id=ressource_id,
            contenu=contenu,
            indice=indice,
            taille_tokens=len(contenu.split()),
            modele_embedding=modele_embedding,
        )
