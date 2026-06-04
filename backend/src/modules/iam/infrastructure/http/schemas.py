from typing import Optional, Literal
from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


# ── Inscription / Connexion (contrat mobile DDD) ─────────────────────────────
class InscriptionRequest(BaseModel):
    email: EmailStr
    mot_de_passe: str
    type_user: Literal["ETUDIANT", "ENSEIGNANT", "ADMIN"] = "ETUDIANT"
    nom: Optional[str] = None
    prenom: Optional[str] = None

    @field_validator("mot_de_passe")
    @classmethod
    def valider_mdp(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Mot de passe trop court (min 6 caractères)")
        return v


class ConnexionRequest(BaseModel):
    email: EmailStr
    mot_de_passe: str


# ── Login / Register (contrat web OpenScience Hub) ───────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = None

    @field_validator("password")
    @classmethod
    def valider_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Mot de passe trop court (min 6 caractères)")
        return v


class UpdateProfilRequest(BaseModel):
    full_name: Optional[str] = None
    institution_id: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Réponse utilisateur unifiée (web + mobile) ───────────────────────────────
class UtilisateurResponse(BaseModel):
    id: str
    email: str
    # Champs mobile (DDD)
    type: str
    nom: Optional[str] = None
    prenom: Optional[str] = None
    actif: bool
    # Champs web (OpenScience Hub)
    role: str
    full_name: Optional[str] = None
    is_active: bool
    institution_id: Optional[str] = None
    created_at: Optional[datetime] = None


class AuthResponse(BaseModel):
    """Réponse login/register pour l'app web (token + utilisateur)."""
    access_token: str
    token_type: str = "bearer"
    user: UtilisateurResponse
