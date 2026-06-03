from abc import ABC, abstractmethod
from typing import Optional, List
import uuid
from ..aggregates.ressource import Ressource


class IRessourceRepository(ABC):
    @abstractmethod
    async def sauvegarder(self, ressource: Ressource) -> None: ...

    @abstractmethod
    async def mettre_a_jour(self, ressource: Ressource) -> None: ...

    @abstractmethod
    async def trouver_par_id(self, id_: uuid.UUID) -> Optional[Ressource]: ...

    @abstractmethod
    async def lister(
        self,
        type_doc: Optional[str] = None,
        niveau_acces: Optional[str] = None,
        ue_id: Optional[uuid.UUID] = None,
        proprietaire_id: Optional[uuid.UUID] = None,
        page: int = 1,
        taille: int = 20,
    ) -> List[Ressource]: ...

    @abstractmethod
    async def rechercher_texte(self, texte: str, page: int = 1, taille: int = 20) -> List[Ressource]: ...
