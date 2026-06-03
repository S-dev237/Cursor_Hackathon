from __future__ import annotations
import uuid
from dataclasses import dataclass, field
from typing import Literal, Optional
from src.shared.domain.aggregate_root import AggregateRoot
from ..value_objects.email import Email
from ..value_objects.niveau_acces import NiveauAcces
from ..events.utilisateur_cree import UtilisateurCreeEvent

TypeUtilisateur = Literal["ETUDIANT", "ENSEIGNANT", "ADMIN"]


@dataclass
class Utilisateur(AggregateRoot):
    id: uuid.UUID
    _email: Email
    _type: TypeUtilisateur
    _mot_de_passe_hash: str
    _actif: bool = True
    _nom: Optional[str] = None
    _prenom: Optional[str] = None

    # ── Factory ────────────────────────────────────────────────────────
    @classmethod
    def creer(
        cls,
        email_str: str,
        type_user: TypeUtilisateur,
        mot_de_passe_hash: str,
        nom: Optional[str] = None,
        prenom: Optional[str] = None,
    ) -> "Utilisateur":
        email = Email.creer(email_str).or_raise()
        id_ = uuid.uuid4()
        u = cls(
            id=id_,
            _email=email,
            _type=type_user,
            _mot_de_passe_hash=mot_de_passe_hash,
            _nom=nom,
            _prenom=prenom,
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

    def est_admin(self) -> bool:
        return self._type == "ADMIN"

    def est_enseignant(self) -> bool:
        return self._type == "ENSEIGNANT"
