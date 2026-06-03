from __future__ import annotations
import uuid
from dataclasses import dataclass
from typing import Optional
from ..value_objects.niveau_formation import NiveauFormation


@dataclass
class Formation:
    id: uuid.UUID
    nom: str
    code: str
    niveau: NiveauFormation
    departement_id: uuid.UUID
    description: Optional[str] = None

    @classmethod
    def creer(
        cls, nom: str, code: str, niveau_str: str, departement_id: uuid.UUID, description: Optional[str] = None
    ) -> "Formation":
        niveau = NiveauFormation.from_str(niveau_str)
        return cls(id=uuid.uuid4(), nom=nom, code=code.upper(), niveau=niveau, departement_id=departement_id, description=description)
