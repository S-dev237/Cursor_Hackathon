from dataclasses import dataclass
from typing import Optional
import uuid
from src.shared.application.event_bus import IEventBus
from ...domain.aggregates.ressource import Ressource
from ...domain.repositories.ressource_repository import IRessourceRepository


@dataclass(frozen=True)
class CreerRessourceCommand:
    titre: str
    type_document: str
    proprietaire_id: uuid.UUID
    niveau_acces: str = "CAMPUS"
    annee: Optional[int] = None
    description: Optional[str] = None
    ue_ids: list[uuid.UUID] = ()


class CreerRessourceUseCase:
    def __init__(self, repo: IRessourceRepository, event_bus: IEventBus):
        self._repo = repo
        self._event_bus = event_bus

    async def execute(self, cmd: CreerRessourceCommand) -> str:
        ressource = Ressource.creer(
            titre=cmd.titre,
            type_str=cmd.type_document,
            proprietaire_id=cmd.proprietaire_id,
            niveau_acces=cmd.niveau_acces,
            annee=cmd.annee,
            description=cmd.description,
        )
        for ue_id in cmd.ue_ids:
            ressource.assigner_ue(ue_id)

        await self._repo.sauvegarder(ressource)
        await self._event_bus.publish(ressource.domain_events)
        ressource.clear_events()
        return str(ressource.id)
