from __future__ import annotations
import uuid
from datetime import datetime, timezone
from dataclasses import dataclass
from typing import Literal, Optional
from src.shared.domain.aggregate_root import AggregateRoot
from ..value_objects.email import Email
from ..value_objects.niveau_acces import NiveauAcces
from ..events.utilisateur_cree import UtilisateurCreeEvent

TypeUtilisateur = Literal["ETUDIANT", "ENSEIGNANT", "ADMIN"]

# Correspondance entre le type métier (DDD/mobile) et le « rôle » attendu
# par l'application web (OpenScience Hub).
_TYPE_TO_ROLE = {
    "ADMIN": "admin",
    "ENSEIGNANT": "academic",
    "ETUDIANT": "student",
}
_ROLE_TO_TYPE = {
    "admin": "ADMIN",
    "academic": "ENSEIGNANT",
    "researcher": "ENSEIGNANT",
    "enseignant": "ENSEIGNANT",
    "student": "ETUDIANT",
    "etudiant": "ETUDIANT",
    "visitor": "ETUDIANT",
}


def role_vers_type(role: Optional[str]) -> TypeUtilisateur:
    """Convertit un rôle (web) en type métier. ETUDIANT par défaut."""
    if not role:
        return "ETUDIANT"
    return _ROLE_TO_TYPE.get(role.strip().lower(), "ETUDIANT")  # type: ignore[return-value]


@dataclass
class Utilisateur(AggregateRoot):
    id: uuid.UUID
    _email: Email
    _type: TypeUtilisateur
    _mot_de_passe_hash: str
    _actif: bool = True
    _nom: Optional[str] = None
    _prenom: Optional[str] = None
    _nom_complet: Optional[str] = None
    _institution_id: Optional[str] = None
    _cree_le: Optional[datetime] = None
    _derniere_connexion: Optional[datetime] = None

    # ── Factory ────────────────────────────────────────────────────────
    @classmethod
    def creer(
        cls,
        email_str: str,
        type_user: TypeUtilisateur,
        mot_de_passe_hash: str,
        nom: Optional[str] = None,
        prenom: Optional[str] = None,
        nom_complet: Optional[str] = None,
        institution_id: Optional[str] = None,
    ) -> "Utilisateur":
        email = Email.creer(email_str).or_raise()
        id_ = uuid.uuid4()
        # Déduit le nom complet si absent à partir de prénom/nom.
        if not nom_complet:
            parts = [p for p in (prenom, nom) if p]
            nom_complet = " ".join(parts) if parts else None
        u = cls(
            id=id_,
            _email=email,
            _type=type_user,
            _mot_de_passe_hash=mot_de_passe_hash,
            _nom=nom,
            _prenom=prenom,
            _nom_complet=nom_complet,
            _institution_id=institution_id,
            _cree_le=datetime.now(timezone.utc),
        )
        u._add_event(UtilisateurCreeEvent(
            utilisateur_id=str(id_),
            email=email_str,
            type_user=type_user,
        ))
        return u

    # ── Comportements ──────────────────────────────────────────────────
    def desactiver(self) -> None:
        self._actif = False

    def activer(self) -> None:
        self._actif = True

    def enregistrer_connexion(self) -> None:
        self._derniere_connexion = datetime.now(timezone.utc)

    def mettre_a_jour_profil(
        self,
        nom_complet: Optional[str] = None,
        institution_id: Optional[str] = None,
    ) -> None:
        if nom_complet is not None:
            self._nom_complet = nom_complet or None
        # institution_id peut être explicitement remis à None (chaîne vide).
        self._institution_id = institution_id or None

    def peut_acceder_niveau(self, niveau: NiveauAcces) -> bool:
        return niveau.est_accessible_authentifie(self._type, self._actif)

    # ── Propriétés (lecture seule) ─────────────────────────────────────
    @property
    def email(self) -> str:
        return self._email.valeur

    @property
    def type(self) -> TypeUtilisateur:
        return self._type

    @property
    def role(self) -> str:
        return _TYPE_TO_ROLE.get(self._type, "student")

    @property
    def actif(self) -> bool:
        return self._actif

    @property
    def mot_de_passe_hash(self) -> str:
        return self._mot_de_passe_hash

    @property
    def nom(self) -> Optional[str]:
        return self._nom

    @property
    def prenom(self) -> Optional[str]:
        return self._prenom

    @property
    def nom_complet(self) -> Optional[str]:
        if self._nom_complet:
            return self._nom_complet
        parts = [p for p in (self._prenom, self._nom) if p]
        return " ".join(parts) if parts else None

    @property
    def institution_id(self) -> Optional[str]:
        return self._institution_id

    @property
    def cree_le(self) -> Optional[datetime]:
        return self._cree_le

    @property
    def derniere_connexion(self) -> Optional[datetime]:
        return self._derniere_connexion

    def est_admin(self) -> bool:
        return self._type == "ADMIN"

    def est_enseignant(self) -> bool:
        return self._type == "ENSEIGNANT"
