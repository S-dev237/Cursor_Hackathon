from dataclasses import dataclass
from typing import List
from ...domain.ports.moteur_regles_port import IMoteurReglesPort


@dataclass(frozen=True)
class ClassifierRessourceCommand:
    ressource_id: str
    titre: str
    mots_cles: List[str]


class ClassifierRessourceUseCase:
    def __init__(self, moteur: IMoteurReglesPort):
        self._moteur = moteur

    async def execute(self, cmd: ClassifierRessourceCommand) -> List[str]:
        return await self._moteur.classifier(
            ressource_id=cmd.ressource_id,
            titre=cmd.titre,
            mots_cles=cmd.mots_cles,
        )
