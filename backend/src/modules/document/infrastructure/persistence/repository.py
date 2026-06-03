from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from ...domain.aggregates.ressource import Ressource
from ...domain.repositories.ressource_repository import IRessourceRepository
from .models import RessourceModel, FichierModel, RessourceUEModel
from .mapper import RessourceMapper, FichierMapper


class SQLModelRessourceRepository(IRessourceRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def sauvegarder(self, ressource: Ressource) -> None:
        model = RessourceMapper.to_model(ressource)
        self._session.add(model)
        for fichier in ressource.fichiers:
            self._session.add(FichierMapper.to_model(fichier))
        for ue_id in ressource.ue_ids:
            self._session.add(RessourceUEModel(ressource_id=ressource.id, ue_id=ue_id))
        await self._session.commit()

    async def mettre_a_jour(self, ressource: Ressource) -> None:
        model = await self._session.get(RessourceModel, ressource.id)
        if model:
            updated = RessourceMapper.to_model(ressource)
            for key, value in updated.model_dump(exclude={"id"}).items():
                setattr(model, key, value)
            # Persiste les nouveaux fichiers
            existing_ids = {
                r.id for r in (await self._session.execute(
                    select(FichierModel).where(FichierModel.ressource_id == ressource.id)
                )).scalars()
            }
            for fichier in ressource.fichiers:
                if fichier.id not in existing_ids:
                    self._session.add(FichierMapper.to_model(fichier))
            await self._session.commit()

    async def trouver_par_id(self, id_: uuid.UUID) -> Optional[Ressource]:
        model = await self._session.get(RessourceModel, id_)
        if not model:
            return None
        fichiers_result = await self._session.execute(
            select(FichierModel).where(FichierModel.ressource_id == id_)
        )
        fichiers = list(fichiers_result.scalars())
        return RessourceMapper.to_domain(model, fichiers)

    async def lister(
        self,
        type_doc: Optional[str] = None,
        niveau_acces: Optional[str] = None,
        ue_id: Optional[uuid.UUID] = None,
        proprietaire_id: Optional[uuid.UUID] = None,
        page: int = 1,
        taille: int = 20,
    ) -> List[Ressource]:
        stmt = select(RessourceModel)
        if type_doc:
            stmt = stmt.where(RessourceModel.type_document == type_doc)
        if niveau_acces:
            stmt = stmt.where(RessourceModel.niveau_acces == niveau_acces)
        if proprietaire_id:
            stmt = stmt.where(RessourceModel.proprietaire_id == proprietaire_id)
        stmt = stmt.offset((page - 1) * taille).limit(taille)
        result = await self._session.execute(stmt)
        return [RessourceMapper.to_domain(m) for m in result.scalars()]

    async def rechercher_texte(self, texte: str, page: int = 1, taille: int = 20) -> List[Ressource]:
        stmt = (
            select(RessourceModel)
            .where(RessourceModel.titre.ilike(f"%{texte}%"))
            .offset((page - 1) * taille)
            .limit(taille)
        )
        result = await self._session.execute(stmt)
        return [RessourceMapper.to_domain(m) for m in result.scalars()]
