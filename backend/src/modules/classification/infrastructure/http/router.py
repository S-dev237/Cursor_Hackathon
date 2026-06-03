from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
import uuid
from src.shared.infrastructure.database import get_async_session
from src.modules.iam.infrastructure.http.dependencies import get_current_user
from ..adapters.prolog_adapter import PrologAdapter
from ..adapters.moteur_organisation_prolog import MoteurOrganisationProlog
from ..persistence.models import ThematiqueModel, MotCleModel
from ..persistence.repository import SQLModelDossierVirtuelRepository
from ...application.use_cases.classifier_ressource import ClassifierRessourceUseCase, ClassifierRessourceCommand
from ...application.use_cases.obtenir_prerequis import ObtenirPrerequisUseCase, ObtenirPrerequisCommand
from ...application.use_cases.organiser_ressource import (
    OrganiserRessourceUseCase, OrganiserRessourceCommand,
)
from ...domain.value_objects.axe_organisation import LIBELLES_AXES
from .schemas import (
    ThematiqueResponse, MotCleResponse,
    ClassifierRequest, PrerequisResponse,
    AxeResponse, DossierResponse, DossierDetailResponse,
    RessourceLite, DossierRessourceResponse, OrganiserResponse,
)

router = APIRouter(prefix="/classification", tags=["Classification"])


def get_prolog_adapter() -> PrologAdapter:
    return PrologAdapter()


_moteur_organisation = MoteurOrganisationProlog()


def get_moteur_organisation() -> MoteurOrganisationProlog:
    return _moteur_organisation


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


# =============================================================================
# Organisation multi-vues — navigation dans les dossiers virtuels
# =============================================================================

@router.get("/axes", response_model=list[AxeResponse])
async def lister_axes(session: AsyncSession = Depends(get_async_session)):
    """Liste les axes de classement utilisés (discipline, domaine, année…)."""
    repo = SQLModelDossierVirtuelRepository(session)
    lignes = await repo.compter_par_axe()
    return [
        AxeResponse(
            axe=axe,
            libelle=LIBELLES_AXES.get(axe, axe.title()),
            nb_dossiers=nb_dossiers,
            nb_documents=nb_documents,
        )
        for axe, nb_dossiers, nb_documents in lignes
    ]


@router.get("/axes/{axe}/dossiers", response_model=list[DossierResponse])
async def lister_dossiers_axe(axe: str, session: AsyncSession = Depends(get_async_session)):
    """Liste les dossiers virtuels d'un axe, avec le nombre de documents."""
    repo = SQLModelDossierVirtuelRepository(session)
    lignes = await repo.lister_dossiers(axe)
    return [
        DossierResponse(
            id=d.id, axe=d.axe, code=d.code, nom=d.nom, nb_documents=nb,
        )
        for d, nb in lignes
    ]


@router.get("/dossiers/{dossier_id}", response_model=DossierDetailResponse)
async def lire_dossier(dossier_id: uuid.UUID, session: AsyncSession = Depends(get_async_session)):
    """Contenu d'un dossier virtuel (le document n'est pas dupliqué)."""
    from src.modules.document.infrastructure.persistence.models import RessourceModel

    repo = SQLModelDossierVirtuelRepository(session)
    dossier = await repo.get_dossier(dossier_id)
    if not dossier:
        raise HTTPException(status_code=404, detail="Dossier introuvable")

    ressource_ids = await repo.lister_ressource_ids(dossier_id)
    ressources: list[RessourceLite] = []
    if ressource_ids:
        result = await session.execute(
            select(RessourceModel).where(RessourceModel.id.in_(ressource_ids))
        )
        ressources = [
            RessourceLite.model_validate(r, from_attributes=True)
            for r in result.scalars()
        ]
    return DossierDetailResponse(
        id=dossier.id, axe=dossier.axe, code=dossier.code, nom=dossier.nom,
        ressources=ressources,
    )


@router.get(
    "/ressources/{ressource_id}/dossiers",
    response_model=list[DossierRessourceResponse],
)
async def lister_dossiers_ressource(
    ressource_id: uuid.UUID, session: AsyncSession = Depends(get_async_session)
):
    """Toutes les vues d'organisation où apparaît un même document."""
    repo = SQLModelDossierVirtuelRepository(session)
    lignes = await repo.lister_dossiers_ressource(ressource_id)
    return [
        DossierRessourceResponse(
            id=d.id,
            axe=d.axe,
            libelle_axe=LIBELLES_AXES.get(d.axe, d.axe.title()),
            code=d.code,
            nom=d.nom,
            origine=origine,
        )
        for d, origine in lignes
    ]


@router.post("/ressources/{ressource_id}/organiser", response_model=OrganiserResponse)
async def organiser_ressource(
    ressource_id: uuid.UUID,
    current_user=Depends(get_current_user),
    moteur: MoteurOrganisationProlog = Depends(get_moteur_organisation),
    session: AsyncSession = Depends(get_async_session),
):
    """
    (Re)déclenche l'organisation automatique d'une ressource :
    métadonnées → Prolog → dossiers virtuels.
    """
    from src.modules.document.infrastructure.persistence.models import RessourceModel

    model = await session.get(RessourceModel, ressource_id)
    if not model:
        raise HTTPException(status_code=404, detail="Ressource introuvable")

    repo = SQLModelDossierVirtuelRepository(session)
    uc = OrganiserRessourceUseCase(moteur=moteur, repo=repo)
    categories = await uc.execute(OrganiserRessourceCommand(
        ressource_id=ressource_id,
        titre=model.titre,
        description=model.description,
        annee=model.annee,
    ))

    lignes = await repo.lister_dossiers_ressource(ressource_id)
    return OrganiserResponse(
        ressource_id=ressource_id,
        mots_cles=moteur.extraire_mots_cles(
            " ".join(filter(None, [model.titre, model.description]))
        ),
        dossiers=[
            DossierRessourceResponse(
                id=d.id,
                axe=d.axe,
                libelle_axe=LIBELLES_AXES.get(d.axe, d.axe.title()),
                code=d.code,
                nom=d.nom,
                origine=origine,
            )
            for d, origine in lignes
        ],
    )
