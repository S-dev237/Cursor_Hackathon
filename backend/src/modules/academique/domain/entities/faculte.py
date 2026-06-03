from __future__ import annotations
import uuid
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Faculte:
    id: uuid.UUID
    nom: str
    code: str
    description: Optional[str] = None

    @classmethod
    def creer(cls, nom: str, code: str, description: Optional[str] = None) -> "Faculte":
        return cls(id=uuid.uuid4(), nom=nom, code=code.upper(), description=description)
