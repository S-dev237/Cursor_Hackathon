from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, func
import uuid
from src.shared.infrastructure.database import get_async_session
from src.modules.iam.infrastructure.http.dependencies import get_current_user
from src.modules.iam.domain.aggregates.utilisateur import Utilisateur
from ..persistence.models import ConsultationModel, TelechargementModel, FavoriModel
from .schemas import ConsultationCreate, FavoriResponse, StatsRessourceResponse

router = APIRouter(prefix="/usage", tags=["Usage"])


@router.post("/consultations", status_code=status.HTTP_201_CREATED)
async def enregistrer_consultation(
    body: ConsultationCreate,
    session: AsyncSession = Depends(get_async_session),
    current_user: Annotated[Utilisateur | None, Depends(get_current_user)] = None,
):
    model = ConsultationModel(
        ressource_id=body.ressource_id,
        utilisateur_id=current_user.id if current_user else None,
        duree_secondes=body.duree_secondes,
    )
    session.add(model)
    await session.commit()
    return {"id": str(model.id)}


@router.get("/favoris", response_model=List[FavoriResponse])
async def lister_favoris(
    current_user: Annotated[Utilisateur, Depends(get_current_user)],
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(FavoriModel).where(FavoriModel.utilisateur_id == current_user.id)
    result = await session.execute(stmt)
    return [FavoriResponse.model_validate(r, from_attributes=True) for r in result.scalars()]


@router.post("/favoris/{ressource_id}", status_code=status.HTTP_201_CREATED)
async def ajouter_favori(
    ressource_id: uuid.UUID,
    current_user: Annotated[Utilisateur, Depends(get_current_user)],
    session: AsyncSession = Depends(get_async_session),
):
    existing = await session.get(FavoriModel, (current_user.id, ressource_id))
    if existing:
        raise HTTPException(status_code=409, detail="Déjà en favoris")
    session.add(FavoriModel(utilisateur_id=current_user.id, ressource_id=ressource_id))
    await session.commit()
    return {"status": "ajouté"}


@router.delete("/favoris/{ressource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def retirer_favori(
    ressource_id: uuid.UUID,
    current_user: Annotated[Utilisateur, Depends(get_current_user)],
    session: AsyncSession = Depends(get_async_session),
):
    model = await session.get(FavoriModel, (current_user.id, ressource_id))
    if not model:
        raise HTTPException(status_code=404, detail="Favori introuvable")
    await session.delete(model)
    await session.commit()


@router.get("/stats/{ressource_id}", response_model=StatsRessourceResponse)
async def stats_ressource(ressource_id: uuid.UUID, session: AsyncSession = Depends(get_async_session)):
    consultations = await session.execute(
        select(func.count()).select_from(ConsultationModel).where(ConsultationModel.ressource_id == ressource_id)
    )
    telechargements = await session.execute(
        select(func.count()).select_from(TelechargementModel).where(TelechargementModel.ressource_id == ressource_id)
    )
    return StatsRessourceResponse(
        ressource_id=ressource_id,
        nb_consultations=consultations.scalar_one(),
        nb_telechargements=telechargements.scalar_one(),
    )
