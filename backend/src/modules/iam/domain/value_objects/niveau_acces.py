from __future__ import annotations
from dataclasses import dataclass
from typing import Literal, Optional

NiveauAccesValeur = Literal["PUBLIC", "CAMPUS", "PRIVE"]
_VALEURS = ("PUBLIC", "CAMPUS", "PRIVE")


@dataclass(frozen=True)
class NiveauAcces:
    """
    Value Object immuable pour le contrôle d'accès.

    PUBLIC  → accessible par tout le monde (même anonyme)
    CAMPUS  → uniquement les utilisateurs authentifiés et actifs
    PRIVE   → uniquement le propriétaire (vérifié dans l'agrégat)
    """
    valeur: NiveauAccesValeur

    @classmethod
    def from_str(cls, v: str) -> "NiveauAcces":
        if v not in _VALEURS:
            raise ValueError(f"NiveauAcces invalide : '{v}'. Valeurs : {_VALEURS}")
        return cls(valeur=v)  # type: ignore[arg-type]

    def est_accessible_anonyme(self) -> bool:
        return self.valeur == "PUBLIC"

    def est_accessible_authentifie(self, type_user: Optional[str], actif: bool) -> bool:
        match self.valeur:
            case "PUBLIC":
                return True
            case "CAMPUS":
                return actif and type_user is not None
            case "PRIVE":
                return False  # vérifié par l'agrégat (proprietaire_id)

    def __str__(self) -> str:
        return self.valeur


# Constantes pratiques
NiveauAcces.PUBLIC = NiveauAcces(valeur="PUBLIC")  # type: ignore[attr-defined]
NiveauAcces.CAMPUS = NiveauAcces(valeur="CAMPUS")  # type: ignore[attr-defined]
NiveauAcces.PRIVE = NiveauAcces(valeur="PRIVE")    # type: ignore[attr-defined]
