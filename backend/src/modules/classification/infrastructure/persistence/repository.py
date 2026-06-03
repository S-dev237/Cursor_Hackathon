from __future__ import annotations
import uuid
from typing import List, Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, delete
from sqlmodel import select

from .models import DossierVirtuelModel, DocumentDossierModel


class SQLModelDossierVirtuelRepository:
    """
    Persistance des dossiers virtuels et de leurs rattachements de ressources.
    Le moteur de règles décide QUOI classer ; ce repository matérialise les
    structures de classement déduites.
    """

    def __init__(self, session: AsyncSession):
        self._session = session

    async def trouver_ou_creer(self, axe: str, code: str, nom: str) -> DossierVirtuelModel:
        axe = axe.upper()
        code = code.lower()
        stmt = select(DossierVirtuelModel).where(
            DossierVirtuelModel.axe == axe,
            DossierVirtuelModel.code == code,
        )
        existant = (await self._session.execute(stmt)).scalars().first()
        if existant:
            return existant
        dossier = DossierVirtuelModel(axe=axe, code=code, nom=nom)
        self._session.add(dossier)
        await self._session.flush()
        return dossier

    async def lier(self, ressource_id: uuid.UUID, dossier_id: uuid.UUID, origine: str = "PROLOG") -> None:
        existant = await self._session.get(
            DocumentDossierModel, (ressource_id, dossier_id)
        )
        if existant:
            existant.origine = origine
            return
        self._session.add(DocumentDossierModel(
            ressource_id=ressource_id,
            dossier_id=dossier_id,
            origine=origine,
        ))

    async def supprimer_liens(self, ressource_id: uuid.UUID, origine: Optional[str] = None) -> None:
        stmt = delete(DocumentDossierModel).where(
            DocumentDossierModel.ressource_id == ressource_id
        )
        if origine:
            stmt = stmt.where(DocumentDossierModel.origine == origine)
        await self._session.execute(stmt)

    async def commit(self) -> None:
        await self._session.commit()

    # ── Requêtes de navigation ─────────────────────────────────────────────
    async def compter_par_axe(self) -> List[Tuple[str, int, int]]:
        """Retourne (axe, nb_dossiers, nb_liens) pour chaque axe utilisé."""
        nb_dossiers = (
            select(
                DossierVirtuelModel.axe,
                func.count(func.distinct(DossierVirtuelModel.id)).label("nb"),
            )
            .group_by(DossierVirtuelModel.axe)
        )
        dossiers_par_axe = {
            row.axe: row.nb for row in (await self._session.execute(nb_dossiers)).all()
        }

        nb_liens_stmt = (
            select(
                DossierVirtuelModel.axe,
                func.count(DocumentDossierModel.ressource_id).label("nb"),
            )
            .join(
                DocumentDossierModel,
                DocumentDossierModel.dossier_id == DossierVirtuelModel.id,
            )
            .group_by(DossierVirtuelModel.axe)
        )
        liens_par_axe = {
            row.axe: row.nb for row in (await self._session.execute(nb_liens_stmt)).all()
        }

        return [
            (axe, dossiers_par_axe.get(axe, 0), liens_par_axe.get(axe, 0))
            for axe in dossiers_par_axe
        ]

    async def lister_dossiers(self, axe: str) -> List[Tuple[DossierVirtuelModel, int]]:
        """Dossiers d'un axe avec le nombre de ressources rattachées."""
        stmt = (
            select(
                DossierVirtuelModel,
                func.count(DocumentDossierModel.ressource_id).label("nb"),
            )
            .outerjoin(
                DocumentDossierModel,
                DocumentDossierModel.dossier_id == DossierVirtuelModel.id,
            )
            .where(DossierVirtuelModel.axe == axe.upper())
            .group_by(DossierVirtuelModel.id)
            .order_by(func.count(DocumentDossierModel.ressource_id).desc(), DossierVirtuelModel.nom)
        )
        return [(row[0], row[1]) for row in (await self._session.execute(stmt)).all()]

    async def lister_ressource_ids(self, dossier_id: uuid.UUID) -> List[uuid.UUID]:
        stmt = select(DocumentDossierModel.ressource_id).where(
            DocumentDossierModel.dossier_id == dossier_id
        )
        return list((await self._session.execute(stmt)).scalars())

    async def get_dossier(self, dossier_id: uuid.UUID) -> Optional[DossierVirtuelModel]:
        return await self._session.get(DossierVirtuelModel, dossier_id)

    async def lister_dossiers_ressource(
        self, ressource_id: uuid.UUID
    ) -> List[Tuple[DossierVirtuelModel, str]]:
        """Tous les dossiers (multi-vues) auxquels appartient une ressource."""
        stmt = (
            select(DossierVirtuelModel, DocumentDossierModel.origine)
            .join(
                DocumentDossierModel,
                DocumentDossierModel.dossier_id == DossierVirtuelModel.id,
            )
            .where(DocumentDossierModel.ressource_id == ressource_id)
            .order_by(DossierVirtuelModel.axe, DossierVirtuelModel.nom)
        )
        return [(row[0], row[1]) for row in (await self._session.execute(stmt)).all()]
