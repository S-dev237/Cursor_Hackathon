from typing import Annotated
import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.infrastructure.database import get_async_session
from src.shared.infrastructure.event_bus import get_event_bus
from ..persistence.repository import SQLModelUtilisateurRepository
from ..services.jwt_service import JWTService
from ..services.password_service import PasswordService
from ...domain.aggregates.utilisateur import Utilisateur

_bearer = HTTPBearer(auto_error=False)
_jwt_service = JWTService()


def get_iam_repo(session: Annotated[AsyncSession, Depends(get_async_session)]):
    return SQLModelUtilisateurRepository(session)


def get_password_service() -> PasswordService:
    return PasswordService()


def get_jwt_service() -> JWTService:
    return _jwt_service


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
) -> Utilisateur:
    # DEV MODE : reconstruit l'utilisateur depuis le token sans accès DB
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token manquant")

    payload = _jwt_service.decoder_token(credentials.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalide")

    from ...domain.value_objects.email import Email

    u = Utilisateur(
        id=uuid.UUID(payload["sub"]),
        _email=Email(valeur=payload["email"]),
        _type=payload.get("type", "ENSEIGNANT"),
        _mot_de_passe_hash="",
        _actif=True,
    )
    return u


def require_admin(
    current_user: Annotated[Utilisateur, Depends(get_current_user)],
) -> Utilisateur:
    if not current_user.est_admin():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux admins")
    return current_user
