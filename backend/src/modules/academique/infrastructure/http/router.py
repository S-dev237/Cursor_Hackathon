from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from src.shared.infrastructure.database import get_async_session
from src.modules.iam.infrastructure.http.dependencies import get_current_user
from ..persistence.models import FaculteModel, DepartementModel, FormationModel, UEModel
from .schemas import (
    FaculteResponse, DepartementResponse, FormationResponse, UEResponse,
    FaculteCreate, DepartementCreate, FormationCreate, UECreate,
)
import uuid

router = APIRouter(prefix="/academique", tags=["Académique"])


@router.get("/facultes", response_model=list[FaculteResponse])
async def lister_facultes(session: AsyncSession = Depends(get_async_session)):
    result = await session.execute(select(FaculteModel))
    return [FaculteResponse.model_validate(r, from_attributes=True) for r in result.scalars()]


@router.post("/facultes", response_model=FaculteResponse, status_code=status.HTTP_201_CREATED)
async def creer_faculte(body: FaculteCreate, session: AsyncSession = Depends(get_async_session)):
    model = FaculteModel(nom=body.nom, code=body.code.upper(), description=body.description)
    session.add(model)
    await session.commit()
    await session.refresh(model)
    return FaculteResponse.model_validate(model, from_attributes=True)


@router.get("/departements", response_model=list[DepartementResponse])
async def lister_departements(
    faculte_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(DepartementModel)
    if faculte_id:
        stmt = stmt.where(DepartementModel.faculte_id == faculte_id)
    result = await session.execute(stmt)
    return [DepartementResponse.model_validate(r, from_attributes=True) for r in result.scalars()]


@router.post("/departements", response_model=DepartementResponse, status_code=status.HTTP_201_CREATED)
async def creer_departement(body: DepartementCreate, session: AsyncSession = Depends(get_async_session)):
    model = DepartementModel(**body.model_dump())
    session.add(model)
    await session.commit()
    await session.refresh(model)
    return DepartementResponse.model_validate(model, from_attributes=True)


@router.get("/formations", response_model=list[FormationResponse])
async def lister_formations(
    departement_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(FormationModel)
    if departement_id:
        stmt = stmt.where(FormationModel.departement_id == departement_id)
    result = await session.execute(stmt)
    return [FormationResponse.model_validate(r, from_attributes=True) for r in result.scalars()]


@router.post("/formations", response_model=FormationResponse, status_code=status.HTTP_201_CREATED)
async def creer_formation(body: FormationCreate, session: AsyncSession = Depends(get_async_session)):
    model = FormationModel(**body.model_dump())
    session.add(model)
    await session.commit()
    await session.refresh(model)
    return FormationResponse.model_validate(model, from_attributes=True)


@router.get("/ues", response_model=list[UEResponse])
async def lister_ues(
    formation_id: uuid.UUID | None = None,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(UEModel)
    if formation_id:
        stmt = stmt.where(UEModel.formation_id == formation_id)
    result = await session.execute(stmt)
    return [UEResponse.model_validate(r, from_attributes=True) for r in result.scalars()]


@router.get("/ues/{ue_id}", response_model=UEResponse)
async def lire_ue(ue_id: uuid.UUID, session: AsyncSession = Depends(get_async_session)):
    from fastapi import HTTPException
    model = await session.get(UEModel, ue_id)
    if not model:
        raise HTTPException(status_code=404, detail="UE introuvable")
    return UEResponse.model_validate(model, from_attributes=True)


@router.post("/ues", response_model=UEResponse, status_code=status.HTTP_201_CREATED)
async def creer_ue(body: UECreate, session: AsyncSession = Depends(get_async_session)):
    model = UEModel(**body.model_dump())
    session.add(model)
    await session.commit()
    await session.refresh(model)
    return UEResponse.model_validate(model, from_attributes=True)
