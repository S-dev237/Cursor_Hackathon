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
from ...application.use_cases.mettre_a_jour_profil import (
    MettreAJourProfilUseCase, MettreAJourProfilCommand
)
from .schemas import (
    InscriptionRequest,
    ConnexionRequest,
    LoginRequest,
    RegisterRequest,
    UpdateProfilRequest,
    TokenResponse,
    UtilisateurResponse,
    AuthResponse,
)
from .dependencies import (
    get_iam_repo, get_password_service, get_jwt_service, get_current_user
)
from ...domain.aggregates.utilisateur import Utilisateur, role_vers_type

router = APIRouter(prefix="/auth", tags=["IAM"])


def _to_user_response(u: Utilisateur) -> UtilisateurResponse:
    return UtilisateurResponse(
        id=str(u.id),
        email=u.email,
        type=u.type,
        nom=u.nom,
        prenom=u.prenom,
        actif=u.actif,
        role=u.role,
        full_name=u.nom_complet,
        is_active=u.actif,
        institution_id=u.institution_id,
        created_at=u.cree_le,
    )


# ── Mobile (DDD) : /inscrire ─────────────────────────────────────────────────
@router.post(
    "/inscrire",
    status_code=status.HTTP_201_CREATED,
    summary="Inscrit un nouvel utilisateur (mobile)",
)
async def inscrire(
    body: InscriptionRequest,
    repo=Depends(get_iam_repo),
    event_bus=Depends(get_event_bus),
    pwd=Depends(get_password_service),
):
    uc = InscrireUtilisateurUseCase(repo=repo, event_bus=event_bus, password_service=pwd)
    try:
        utilisateur = await uc.execute(
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
    return {"id": str(utilisateur.id)}


# ── Mobile (DDD) : /connecter ────────────────────────────────────────────────
@router.post("/connecter", response_model=TokenResponse, summary="Connexion JWT (mobile)")
async def connecter(
    body: ConnexionRequest,
    repo=Depends(get_iam_repo),
    pwd=Depends(get_password_service),
    jwt=Depends(get_jwt_service),
):
    uc = ConnecterUtilisateurUseCase(repo=repo, password_service=pwd, jwt_service=jwt)
    try:
        result = await uc.execute(
            ConnecterUtilisateurCommand(email=body.email, mot_de_passe=body.mot_de_passe)
        )
    except DomainException as e:
        raise domain_exception_to_http(e)
    return TokenResponse(access_token=result.token.access_token)


# ── Web (OpenScience Hub) : /register ────────────────────────────────────────
@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Inscription (web) — renvoie token + utilisateur",
)
async def register(
    body: RegisterRequest,
    repo=Depends(get_iam_repo),
    event_bus=Depends(get_event_bus),
    pwd=Depends(get_password_service),
    jwt=Depends(get_jwt_service),
):
    inscrire_uc = InscrireUtilisateurUseCase(repo=repo, event_bus=event_bus, password_service=pwd)
    try:
        utilisateur = await inscrire_uc.execute(
            InscrireUtilisateurCommand(
                email=body.email,
                mot_de_passe=body.password,
                type_user=role_vers_type(body.role),
                nom_complet=body.full_name,
            )
        )
    except DomainException as e:
        raise domain_exception_to_http(e)

    token = jwt.creer_token(
        utilisateur_id=str(utilisateur.id),
        email=utilisateur.email,
        type_user=utilisateur.type,
    )
    return AuthResponse(access_token=token, user=_to_user_response(utilisateur))


# ── Web (OpenScience Hub) : /login ───────────────────────────────────────────
@router.post("/login", response_model=AuthResponse, summary="Connexion (web) — token + utilisateur")
async def login(
    body: LoginRequest,
    repo=Depends(get_iam_repo),
    pwd=Depends(get_password_service),
    jwt=Depends(get_jwt_service),
):
    uc = ConnecterUtilisateurUseCase(repo=repo, password_service=pwd, jwt_service=jwt)
    try:
        result = await uc.execute(
            ConnecterUtilisateurCommand(email=body.email, mot_de_passe=body.password)
        )
    except DomainException as e:
        raise domain_exception_to_http(e)
    return AuthResponse(
        access_token=result.token.access_token,
        user=_to_user_response(result.utilisateur),
    )


# ── Profil courant ───────────────────────────────────────────────────────────
@router.get("/me", response_model=UtilisateurResponse, summary="Profil utilisateur courant")
async def me(current: Annotated[Utilisateur, Depends(get_current_user)]):
    return _to_user_response(current)


@router.put("/me", response_model=UtilisateurResponse, summary="Met à jour le profil courant")
async def update_me(
    body: UpdateProfilRequest,
    current: Annotated[Utilisateur, Depends(get_current_user)],
    repo=Depends(get_iam_repo),
):
    uc = MettreAJourProfilUseCase(repo=repo)
    try:
        utilisateur = await uc.execute(
            MettreAJourProfilCommand(
                utilisateur_id=current.id,
                nom_complet=body.full_name,
                institution_id=body.institution_id,
            )
        )
    except DomainException as e:
        raise domain_exception_to_http(e)
    return _to_user_response(utilisateur)
