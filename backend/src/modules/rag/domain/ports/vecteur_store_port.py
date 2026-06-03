from abc import ABC, abstractmethod
from typing import List
from dataclasses import dataclass


@dataclass(frozen=True)
class ResultatRecherche:
    chunk_id: str
    ressource_id: str
    contenu: str
    score: float


class IVecteurStorePort(ABC):
    @abstractmethod
    async def indexer(self, chunk_id: str, ressource_id: str, contenu: str, vecteur: List[float]) -> None: ...

    @abstractmethod
    async def rechercher(self, vecteur: List[float], limite: int = 5) -> List[ResultatRecherche]: ...

    @abstractmethod
    async def supprimer_ressource(self, ressource_id: str) -> None: ...
