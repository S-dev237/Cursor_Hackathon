from abc import ABC, abstractmethod
from typing import BinaryIO


class IStockagePort(ABC):
    @abstractmethod
    async def uploader(
        self,
        bucket: str,
        key: str,
        contenu: BinaryIO,
        taille: int,
        content_type: str = "application/pdf",
    ) -> str:
        """Upload un fichier et retourne l'URL publique ou la clé."""
        ...

    @abstractmethod
    async def telecharger_url(self, bucket: str, key: str, expires: int = 3600) -> str:
        """Génère une URL pré-signée pour télécharger."""
        ...

    @abstractmethod
    async def supprimer(self, bucket: str, key: str) -> None: ...

    @abstractmethod
    async def creer_bucket_si_absent(self, bucket: str) -> None: ...
