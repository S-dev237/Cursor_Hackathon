from __future__ import annotations
import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Departement:
    id: uuid.UUID
    nom: str
    code: str
    faculte_id: uuid.UUID
    description: Optional[str] = None

    @classmethod
    def creer(cls, nom: str, code: str, faculte_id: uuid.UUID, description: Optional[str] = None) -> "Departement":
        return cls(id=uuid.uuid4(), nom=nom, code=code.upper(), faculte_id=faculte_id, description=description)
