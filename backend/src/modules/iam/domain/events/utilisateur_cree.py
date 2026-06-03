from __future__ import annotations
from dataclasses import dataclass
from src.shared.domain.domain_event import BaseDomainEvent


@dataclass(frozen=True)
class UtilisateurCreeEvent(BaseDomainEvent):
    utilisateur_id: str = ""
    email: str = ""
    type_user: str = ""
