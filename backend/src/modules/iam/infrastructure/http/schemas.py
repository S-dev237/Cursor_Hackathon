from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, field_validator


class InscriptionRequest(BaseModel):
    email: EmailStr
    mot_de_passe: str
    type_user: Literal["ETUDIANT", "ENSEIGNANT", "ADMIN"] = "ETUDIANT"
    nom: Optional[str] = None
    prenom: Optional[str] = None

    @field_validator("mot_de_passe")
    @classmethod
    def valider_mdp(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Mot de passe trop court (min 8 caractères)")
        return v


class ConnexionRequest(BaseModel):
    email: EmailStr
    mot_de_passe: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UtilisateurResponse(BaseModel):
    id: str
    email: str
    type: str
    nom: Optional[str] = None
    prenom: Optional[str] = None
    actif: bool
