from dataclasses import dataclass
from typing import List
from ...domain.ports.moteur_regles_port import IMoteurReglesPort


@dataclass(frozen=True)
class ObtenirPrerequisCommand:
    ue_code: str


class ObtenirPrerequisUseCase:
    def __init__(self, moteur: IMoteurReglesPort):
        self._moteur = moteur

    async def execute(self, cmd: ObtenirPrerequisCommand) -> List[str]:
        return await self._moteur.obtenir_prerequis(cmd.ue_code)
