from __future__ import annotations
import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Thematique:
    id: uuid.UUID
    code: str
    libelle: str
    parent_id: Optional[uuid.UUID] = None

    @classmethod
    def creer(cls, code: str, libelle: str, parent_id: Optional[uuid.UUID] = None) -> "Thematique":
        return cls(id=uuid.uuid4(), code=code.upper(), libelle=libelle, parent_id=parent_id)
