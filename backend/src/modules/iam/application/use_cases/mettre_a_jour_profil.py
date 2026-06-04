import uuid
from dataclasses import dataclass
from typing import Optional
from ...domain.aggregates.utilisateur import Utilisateur
from ...domain.repositories.utilisateur_repository import IUtilisateurRepository
from ..exceptions import UtilisateurIntrouvableException


@dataclass(frozen=True)
class MettreAJourProfilCommand:
    utilisateur_id: uuid.UUID
    nom_complet: Optional[str] = None
    institution_id: Optional[str] = None


class MettreAJourProfilUseCase:
    def __init__(self, repo: IUtilisateurRepository):
        self._repo = repo

    async def execute(self, cmd: MettreAJourProfilCommand) -> Utilisateur:
        utilisateur = await self._repo.trouver_par_id(cmd.utilisateur_id)
        if not utilisateur:
            raise UtilisateurIntrouvableException()

        utilisateur.mettre_a_jour_profil(
            nom_complet=cmd.nom_complet,
            institution_id=cmd.institution_id,
        )
        await self._repo.mettre_a_jour(utilisateur)
        return utilisateur
