from dataclasses import dataclass
from typing import Literal
from src.shared.application.event_bus import IEventBus
from ...domain.aggregates.utilisateur import Utilisateur, TypeUtilisateur
from ...domain.repositories.utilisateur_repository import IUtilisateurRepository
from ...infrastructure.services.password_service import PasswordService
from ..exceptions import EmailDejaUtiliseException


@dataclass(frozen=True)
class InscrireUtilisateurCommand:
    email: str
    mot_de_passe: str
    type_user: TypeUtilisateur = "ETUDIANT"
    nom: str | None = None
    prenom: str | None = None
    nom_complet: str | None = None
    institution_id: str | None = None


class InscrireUtilisateurUseCase:
    def __init__(
        self,
        repo: IUtilisateurRepository,
        event_bus: IEventBus,
        password_service: PasswordService,
    ):
        self._repo = repo
        self._event_bus = event_bus
        self._pwd = password_service

    async def execute(self, cmd: InscrireUtilisateurCommand) -> Utilisateur:
        if await self._repo.existe_par_email(cmd.email):
            raise EmailDejaUtiliseException(cmd.email)

        hash_ = self._pwd.hacher(cmd.mot_de_passe)
        utilisateur = Utilisateur.creer(
            email_str=cmd.email,
            type_user=cmd.type_user,
            mot_de_passe_hash=hash_,
            nom=cmd.nom,
            prenom=cmd.prenom,
            nom_complet=cmd.nom_complet,
            institution_id=cmd.institution_id,
        )

        await self._repo.sauvegarder(utilisateur)
        await self._event_bus.publish(utilisateur.domain_events)
        utilisateur.clear_events()
        return utilisateur
