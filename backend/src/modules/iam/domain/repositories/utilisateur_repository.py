from abc import ABC, abstractmethod
from typing import Optional
import uuid
from ..aggregates.utilisateur import Utilisateur


class IUtilisateurRepository(ABC):
    @abstractmethod
    async def sauvegarder(self, utilisateur: Utilisateur) -> None: ...

    @abstractmethod
    async def mettre_a_jour(self, utilisateur: Utilisateur) -> None: ...

    @abstractmethod
    async def trouver_par_id(self, id_: uuid.UUID) -> Optional[Utilisateur]: ...

    @abstractmethod
    async def trouver_par_email(self, email: str) -> Optional[Utilisateur]: ...

    @abstractmethod
    async def existe_par_email(self, email: str) -> bool: ...
