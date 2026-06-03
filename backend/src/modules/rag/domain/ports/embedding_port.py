from abc import ABC, abstractmethod
from typing import List


class IEmbeddingPort(ABC):
    @abstractmethod
    async def vectoriser(self, texte: str) -> List[float]:
        """Retourne le vecteur d'embedding pour un texte."""
        ...

    @abstractmethod
    async def vectoriser_batch(self, textes: List[str]) -> List[List[float]]:
        """Vectorise plusieurs textes en batch."""
        ...

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Retourne la dimension des vecteurs produits."""
        ...
