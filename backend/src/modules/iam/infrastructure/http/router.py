from typing import Annotated
from fastapi import APIRouter, Depends, status
from src.shared.infrastructure.event_bus import get_event_bus
from src.shared.infrastructure.exceptions import domain_exception_to_http, DomainException
from ...application.use_cases.inscrire_utilisateur import (
    InscrireUtilisateurUseCase, InscrireUtilisateurCommand
)
from ...application.use_cases.connecter_utilisateur import (
    ConnecterUtilisateurUseCase, ConnecterUtilisateurCommand
)
from .schemas import InscriptionRequest, ConnexionRequest, TokenResponse, UtilisateurResponse
from .dependencies import (
    get_iam_repo, get_password_service, get_jwt_service, get_current_user
)
from ...domain.aggregates.utilisateur import Utilisateur

router = APIRouter(prefix="/auth", tags=["IAM"])


@router.post(
    "/inscrire",
    status_code=status.HTTP_201_CREATED,
    summary="Inscrit un nouvel utilisateur",
)
async def inscrire(
    body: InscriptionRequest,
    repo=Depends(get_iam_repo),
    event_bus=Depends(get_event_bus),
    pwd=Depends(get_password_service),
):
    uc = InscrireUtilisateurUseCase(repo=repo, event_bus=event_bus, password_service=pwd)
    try:
        utilisateur_id = await uc.execute(
            InscrireUtilisateurCommand(
                email=body.email,
                mot_de_passe=body.mot_de_passe,
                type_user=body.type_user,
                nom=body.nom,
                prenom=body.prenom,
            )
        )
    except DomainException as e:
        raise domain_exception_to_http(e)
    return {"id": utilisateur_id}


@router.post("/connecter", response_model=TokenResponse, summary="Connexion JWT")
async def connecter(
    body: ConnexionRequest,
    repo=Depends(get_iam_repo),
    pwd=Depends(get_password_service),
    jwt=Depends(get_jwt_service),
):
    uc = ConnecterUtilisateurUseCase(repo=repo, password_service=pwd, jwt_service=jwt)
    try:
        token = await uc.execute(ConnecterUtilisateurCommand(
            email=body.email,
            mot_de_passe=body.mot_de_passe,
        ))
    except DomainException as e:
        raise domain_exception_to_http(e)
    return TokenResponse(access_token=token.access_token)


@router.get("/me", response_model=UtilisateurResponse, summary="Profil utilisateur courant")
async def me(current: Annotated[Utilisateur, Depends(get_current_user)]):
    return UtilisateurResponse(
        id=str(current.id),
        email=current.email,
        type=current.type,
        nom=current.nom,
        prenom=current.prenom,
        actif=current.actif,
    )
