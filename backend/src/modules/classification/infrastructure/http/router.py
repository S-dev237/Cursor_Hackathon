from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid
from src.shared.infrastructure.database import get_async_session
from src.modules.iam.infrastructure.http.dependencies import get_current_user
from ..adapters.prolog_adapter import PrologAdapter
from ..persistence.models import ThematiqueModel, MotCleModel
from ...application.use_cases.classifier_ressource import ClassifierRessourceUseCase, ClassifierRessourceCommand
from ...application.use_cases.obtenir_prerequis import ObtenirPrerequisUseCase, ObtenirPrerequisCommand
from .schemas import (
    ThematiqueResponse, MotCleResponse,
    ClassifierRequest, PrerequisResponse,
)

router = APIRouter(prefix="/classification", tags=["Classification"])


def get_prolog_adapter() -> PrologAdapter:
    return PrologAdapter()


@router.get("/thematiques", response_model=list[ThematiqueResponse])
async def lister_thematiques(session: AsyncSession = Depends(get_async_session)):
    result = await session.execute(select(ThematiqueModel))
    return [ThematiqueResponse.model_validate(r, from_attributes=True) for r in result.scalars()]


@router.get("/mots-cles", response_model=list[MotCleResponse])
async def lister_mots_cles(session: AsyncSession = Depends(get_async_session)):
    result = await session.execute(select(MotCleModel))
    return [MotCleResponse.model_validate(r, from_attributes=True) for r in result.scalars()]


@router.post("/classifier")
async def classifier_ressource(
    body: ClassifierRequest,
    prolog: PrologAdapter = Depends(get_prolog_adapter),
):
    uc = ClassifierRessourceUseCase(moteur=prolog)
    thematiques = await uc.execute(ClassifierRessourceCommand(
        ressource_id=body.ressource_id,
        titre=body.titre,
        mots_cles=body.mots_cles,
    ))
    return {"thematiques": thematiques}


@router.get("/prerequis/{ue_code}", response_model=PrerequisResponse)
async def prerequis_ue(ue_code: str, prolog: PrologAdapter = Depends(get_prolog_adapter)):
    uc = ObtenirPrerequisUseCase(moteur=prolog)
    prerequis = await uc.execute(ObtenirPrerequisCommand(ue_code=ue_code.upper()))
    return PrerequisResponse(ue_code=ue_code.upper(), prerequis=prerequis)


@router.get("/recommander/{ressource_id}")
async def recommander(ressource_id: str, prolog: PrologAdapter = Depends(get_prolog_adapter)):
    recommandations = await prolog.recommander(ressource_id)
    return {"ressource_id": ressource_id, "recommandations": recommandations}


@router.get("/sante")
async def sante_prolog(prolog: PrologAdapter = Depends(get_prolog_adapter)):
    ok = await prolog.sante()
    return {"prolog_ok": ok}
