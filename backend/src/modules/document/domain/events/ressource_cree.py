from __future__ import annotations
from dataclasses import dataclass
from src.shared.domain.domain_event import BaseDomainEvent


@dataclass(frozen=True)
class RessourceCreeEvent(BaseDomainEvent):
    ressource_id: str = ""
    titre: str = ""
    type_document: str = ""
    proprietaire_id: str = ""
    niveau_acces: str = ""


@dataclass(frozen=True)
class FichierAjouteEvent(BaseDomainEvent):
    ressource_id: str = ""
    fichier_id: str = ""
    minio_bucket: str = ""
    minio_key: str = ""


@dataclass(frozen=True)
class RessourcePublieeEvent(BaseDomainEvent):
    ressource_id: str = ""
