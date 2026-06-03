from abc import ABC, abstractmethod
from typing import List


class IMoteurReglesPort(ABC):
    @abstractmethod
    async def classifier(self, ressource_id: str, titre: str, mots_cles: List[str]) -> List[str]:
        """Retourne les codes de thématiques inférées par Prolog."""
        ...

    @abstractmethod
    async def recommander(self, ressource_id: str) -> List[str]:
        """Retourne les IDs de ressources recommandées via Prolog."""
        ...

    @abstractmethod
    async def obtenir_prerequis(self, ue_code: str) -> List[str]:
        """Retourne les codes UE prérequis pour une UE donnée."""
        ...

    @abstractmethod
    async def sante(self) -> bool:
        """Vérifie que le serveur Prolog est joignable."""
        ...
