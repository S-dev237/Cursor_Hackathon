from abc import ABC, abstractmethod
from typing import Optional, List
import uuid
from ..aggregates.ue import UE


class IUERepository(ABC):
    @abstractmethod
    async def sauvegarder(self, ue: UE) -> None: ...

    @abstractmethod
    async def trouver_par_id(self, id_: uuid.UUID) -> Optional[UE]: ...

    @abstractmethod
    async def trouver_par_code(self, code: str) -> Optional[UE]: ...

    @abstractmethod
    async def lister_par_formation(self, formation_id: uuid.UUID) -> List[UE]: ...
