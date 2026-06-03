from dataclasses import dataclass
from typing import BinaryIO
import uuid
import hashlib
from src.shared.application.event_bus import IEventBus
from src.shared.infrastructure.exceptions import NotFoundException
from ...domain.entities.fichier import Fichier
from ...domain.repositories.ressource_repository import IRessourceRepository
from ...domain.ports.stockage_port import IStockagePort
from src.shared.infrastructure.settings import get_settings

settings = get_settings()


@dataclass
class AjouterFichierCommand:
    ressource_id: uuid.UUID
    contenu: BinaryIO
    nom_original: str
    taille_octets: int
    type_mime: str = "application/pdf"


class AjouterFichierUseCase:
    def __init__(
        self,
        repo: IRessourceRepository,
        stockage: IStockagePort,
        event_bus: IEventBus,
    ):
        self._repo = repo
        self._stockage = stockage
        self._event_bus = event_bus

    async def execute(self, cmd: AjouterFichierCommand) -> str:
        ressource = await self._repo.trouver_par_id(cmd.ressource_id)
        if not ressource:
            raise NotFoundException(f"Ressource {cmd.ressource_id} introuvable")

        fichier_id = uuid.uuid4()
        minio_key = f"{cmd.ressource_id}/{fichier_id}/{cmd.nom_original}"

        await self._stockage.creer_bucket_si_absent(settings.minio_bucket)
        await self._stockage.uploader(
            bucket=settings.minio_bucket,
            key=minio_key,
            contenu=cmd.contenu,
            taille=cmd.taille_octets,
            content_type=cmd.type_mime,
        )

        fichier = Fichier.creer(
            ressource_id=cmd.ressource_id,
            minio_bucket=settings.minio_bucket,
            minio_key=minio_key,
            nom_original=cmd.nom_original,
            taille_octets=cmd.taille_octets,
            type_mime=cmd.type_mime,
        )
        fichier.id = fichier_id
        ressource.ajouter_fichier(fichier)

        await self._repo.mettre_a_jour(ressource)
        await self._event_bus.publish(ressource.domain_events)
        ressource.clear_events()
        return str(fichier_id)
