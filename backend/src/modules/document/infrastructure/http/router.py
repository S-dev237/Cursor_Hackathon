from typing import Annotated, List
from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import or_, text
from sqlmodel import select
import uuid
from src.shared.infrastructure.database import get_async_session
from src.shared.infrastructure.event_bus import get_event_bus
from src.shared.infrastructure.exceptions import domain_exception_to_http, DomainException
from src.modules.iam.infrastructure.http.dependencies import get_current_user
from src.modules.iam.domain.aggregates.utilisateur import Utilisateur
from ..persistence.models import RessourceModel, FichierModel
from ..persistence.repository import SQLModelRessourceRepository
from ..persistence.mapper import RessourceMapper
from ..adapters.minio_adapter import MinioAdapter
from ...application.use_cases.creer_ressource import CreerRessourceUseCase, CreerRessourceCommand
from ...application.use_cases.ajouter_fichier import AjouterFichierUseCase, AjouterFichierCommand
from .schemas import RessourceCreate, RessourceResponse, FichierResponse, PresignedUrlResponse

router = APIRouter(prefix="/ressources", tags=["Document"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def creer_ressource(
    body: RessourceCreate,
    current_user: Annotated[Utilisateur, Depends(get_current_user)],
    session: AsyncSession = Depends(get_async_session),
    event_bus=Depends(get_event_bus),
):
    repo = SQLModelRessourceRepository(session)
    uc = CreerRessourceUseCase(repo=repo, event_bus=event_bus)
    try:
        ressource_id = await uc.execute(CreerRessourceCommand(
            titre=body.titre,
            type_document=body.type_document,
            proprietaire_id=current_user.id,
            niveau_acces=body.niveau_acces,
            annee=body.annee,
            description=body.description,
            ue_ids=body.ue_ids,
        ))
    except DomainException as e:
        raise domain_exception_to_http(e)
    return {"id": ressource_id}


@router.get("/", response_model=List[RessourceResponse])
async def lister_ressources(
    current_user: Annotated[Utilisateur, Depends(get_current_user)],
    type_doc: str | None = None,
    categorie: str | None = None,
    q: str | None = None,
    mine: bool = False,
    session: AsyncSession = Depends(get_async_session),
):
    stmt = select(RessourceModel)

    if mine:
        # Mes documents : tout ce que je possède (publié ou non)
        stmt = stmt.where(RessourceModel.proprietaire_id == current_user.id)
    else:
        # Catalogue : publiés OU possédés par l'utilisateur courant
        stmt = stmt.where(
            or_(
                RessourceModel.publiee == True,
                RessourceModel.proprietaire_id == current_user.id,
            )
        )

    if type_doc:
        stmt = stmt.where(RessourceModel.type_document == type_doc.upper())
    if categorie:
        stmt = stmt.where(RessourceModel.categorie == categorie.upper())
    if q:
        stmt = stmt.where(RessourceModel.titre.ilike(f"%{q}%"))

    stmt = stmt.order_by(RessourceModel.titre)
    result = await session.execute(stmt)
    return [
        RessourceResponse.model_validate(r, from_attributes=True)
        for r in result.scalars()
    ]


@router.get("/{ressource_id}", response_model=RessourceResponse)
async def lire_ressource(ressource_id: uuid.UUID, session: AsyncSession = Depends(get_async_session)):
    model = await session.get(RessourceModel, ressource_id)
    if not model:
        raise HTTPException(status_code=404, detail="Ressource introuvable")
    return RessourceResponse.model_validate(model, from_attributes=True)


@router.post("/{ressource_id}/fichiers", status_code=status.HTTP_201_CREATED)
async def uploader_fichier(
    ressource_id: uuid.UUID,
    fichier: UploadFile = File(...),
    current_user: Annotated[Utilisateur, Depends(get_current_user)] = None,
    session: AsyncSession = Depends(get_async_session),
    event_bus=Depends(get_event_bus),
):
    repo = SQLModelRessourceRepository(session)
    stockage = MinioAdapter()
    uc = AjouterFichierUseCase(repo=repo, stockage=stockage, event_bus=event_bus)
    contenu = await fichier.read()
    import io
    fichier_id = await uc.execute(AjouterFichierCommand(
        ressource_id=ressource_id,
        contenu=io.BytesIO(contenu),
        nom_original=fichier.filename or "fichier.pdf",
        taille_octets=len(contenu),
        type_mime=fichier.content_type or "application/pdf",
    ))

    # Auto-publication : une ressource dotée d'un fichier devient visible au catalogue
    model = await session.get(RessourceModel, ressource_id)
    if model and not model.publiee:
        model.publiee = True
        await session.commit()

    return {"fichier_id": fichier_id}


@router.delete("/{ressource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def supprimer_ressource(
    ressource_id: uuid.UUID,
    current_user: Annotated[Utilisateur, Depends(get_current_user)],
    session: AsyncSession = Depends(get_async_session),
):
    model = await session.get(RessourceModel, ressource_id)
    if not model:
        raise HTTPException(status_code=404, detail="Ressource introuvable")

    # Seul le propriétaire ou un admin peut supprimer
    if model.proprietaire_id != current_user.id and not current_user.est_admin():
        raise HTTPException(
            status_code=403,
            detail="Vous ne pouvez supprimer que vos propres documents",
        )

    # Récupère les fichiers pour nettoyage MinIO
    fichiers_result = await session.execute(
        select(FichierModel).where(FichierModel.ressource_id == ressource_id)
    )
    fichiers = list(fichiers_result.scalars())

    # Supprime les lignes référençant la ressource (toutes schémas confondus)
    tables_referencantes = [
        "usage.consultation",
        "usage.telechargement",
        "usage.favori",
        "rag.chunk",
        "classification.ressource_thematique",
        "classification.ressource_mot_cle",
        "document.ressource_ue",
        "document.ressource_auteur",
        "document.fichier",
    ]
    for table in tables_referencantes:
        await session.execute(
            text(f"DELETE FROM {table} WHERE ressource_id = :rid"),
            {"rid": str(ressource_id)},
        )
    await session.delete(model)
    await session.commit()

    # Nettoyage du stockage objet (best-effort, non bloquant)
    stockage = MinioAdapter()
    for f in fichiers:
        try:
            await stockage.supprimer(f.minio_bucket, f.minio_key)
        except Exception:
            pass

    return None


@router.get("/{ressource_id}/fichiers")
async def lister_fichiers(
    ressource_id: uuid.UUID,
    current_user: Annotated[Utilisateur, Depends(get_current_user)],
    session: AsyncSession = Depends(get_async_session),
):
    result = await session.execute(
        select(FichierModel).where(FichierModel.ressource_id == ressource_id)
    )
    fichiers = list(result.scalars())
    stockage = MinioAdapter()
    sortie = []
    for f in fichiers:
        url = None
        try:
            url = await stockage.telecharger_url(f.minio_bucket, f.minio_key)
        except Exception:
            url = None
        sortie.append({
            "id": str(f.id),
            "nom_original": f.nom_original,
            "taille_octets": f.taille_octets,
            "type_mime": f.type_mime,
            "url": url,
        })
    return sortie


@router.get("/{ressource_id}/fichiers/{fichier_id}/url", response_model=PresignedUrlResponse)
async def obtenir_url_telechargement(
    ressource_id: uuid.UUID,
    fichier_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
):
    model = await session.get(FichierModel, fichier_id)
    if not model or model.ressource_id != ressource_id:
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    stockage = MinioAdapter()
    url = await stockage.telecharger_url(model.minio_bucket, model.minio_key)
    return PresignedUrlResponse(url=url)
