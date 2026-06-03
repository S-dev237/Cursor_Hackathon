from typing import Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from ...domain.aggregates.utilisateur import Utilisateur
from ...domain.repositories.utilisateur_repository import IUtilisateurRepository
from .models import UtilisateurModel
from .mapper import UtilisateurMapper


class SQLModelUtilisateurRepository(IUtilisateurRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def sauvegarder(self, utilisateur: Utilisateur) -> None:
        model = UtilisateurMapper.to_model(utilisateur)
        self._session.add(model)
        await self._session.commit()

    async def mettre_a_jour(self, utilisateur: Utilisateur) -> None:
        result = await self._session.get(UtilisateurModel, utilisateur.id)
        if result:
            updated = UtilisateurMapper.to_model(utilisateur)
            for key, value in updated.model_dump(exclude={"id"}).items():
                setattr(result, key, value)
            await self._session.commit()

    async def trouver_par_id(self, id_: uuid.UUID) -> Optional[Utilisateur]:
        model = await self._session.get(UtilisateurModel, id_)
        return UtilisateurMapper.to_domain(model) if model else None

    async def trouver_par_email(self, email: str) -> Optional[Utilisateur]:
        stmt = select(UtilisateurModel).where(UtilisateurModel.email == email.lower())
        result = await self._session.execute(stmt)
        model = result.scalar_one_or_none()
        return UtilisateurMapper.to_domain(model) if model else None

    async def existe_par_email(self, email: str) -> bool:
        model = await self.trouver_par_email(email)
        return model is not None
