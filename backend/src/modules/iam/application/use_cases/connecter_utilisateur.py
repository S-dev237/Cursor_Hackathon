from dataclasses import dataclass
from ...domain.aggregates.utilisateur import Utilisateur
from ...domain.repositories.utilisateur_repository import IUtilisateurRepository
from ...infrastructure.services.password_service import PasswordService
from ...infrastructure.services.jwt_service import JWTService
from ..exceptions import IdentifiantsInvalidesException, UtilisateurInactifException


@dataclass(frozen=True)
class ConnecterUtilisateurCommand:
    email: str
    mot_de_passe: str


@dataclass(frozen=True)
class TokenDTO:
    access_token: str
    token_type: str = "bearer"


@dataclass(frozen=True)
class ConnexionResult:
    token: TokenDTO
    utilisateur: Utilisateur


class ConnecterUtilisateurUseCase:
    def __init__(
        self,
        repo: IUtilisateurRepository,
        password_service: PasswordService,
        jwt_service: JWTService,
    ):
        self._repo = repo
        self._pwd = password_service
        self._jwt = jwt_service

    async def execute(self, cmd: ConnecterUtilisateurCommand) -> ConnexionResult:
        utilisateur = await self._repo.trouver_par_email(cmd.email)
        if not utilisateur:
            raise IdentifiantsInvalidesException()

        if not self._pwd.verifier(cmd.mot_de_passe, utilisateur.mot_de_passe_hash):
            raise IdentifiantsInvalidesException()

        if not utilisateur.actif:
            raise UtilisateurInactifException()

        utilisateur.enregistrer_connexion()
        await self._repo.mettre_a_jour(utilisateur)

        token = self._jwt.creer_token(
            utilisateur_id=str(utilisateur.id),
            email=utilisateur.email,
            type_user=utilisateur.type,
        )
        return ConnexionResult(token=TokenDTO(access_token=token), utilisateur=utilisateur)
