from abc import ABC, abstractmethod
from typing import List


class ILLMPort(ABC):
    @abstractmethod
    async def generer_reponse(self, question: str, contextes: List[str]) -> str:
        """Génère une réponse RAG à partir de la question et des contextes récupérés."""
        ...
