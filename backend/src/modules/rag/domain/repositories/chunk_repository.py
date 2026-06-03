from abc import ABC, abstractmethod
from typing import List, Optional
import uuid
from ..entities.chunk import Chunk


class IChunkRepository(ABC):
    @abstractmethod
    async def sauvegarder_batch(self, chunks: List[Chunk]) -> None: ...

    @abstractmethod
    async def trouver_par_ressource(self, ressource_id: uuid.UUID) -> List[Chunk]: ...

    @abstractmethod
    async def supprimer_par_ressource(self, ressource_id: uuid.UUID) -> None: ...
