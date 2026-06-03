from __future__ import annotations
import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Auteur:
    id: uuid.UUID
    nom: str
    prenom: str
    email: Optional[str] = None
    affiliation: Optional[str] = None
    orcid: Optional[str] = None

    @classmethod
    def creer(cls, nom: str, prenom: str, email: Optional[str] = None, affiliation: Optional[str] = None, orcid: Optional[str] = None) -> "Auteur":
        return cls(id=uuid.uuid4(), nom=nom, prenom=prenom, email=email, affiliation=affiliation, orcid=orcid)
