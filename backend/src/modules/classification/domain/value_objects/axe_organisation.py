from __future__ import annotations
from dataclasses import dataclass
from typing import Literal

# Les différents axes d'organisation multi-vues. Un même document peut
# apparaître dans plusieurs dossiers virtuels, répartis sur ces axes.
AxeValeur = Literal[
    "DISCIPLINE",   # IA → ML → Deep Learning …
    "DOMAINE",      # Domaine d'application : Santé, Finance …
    "ANNEE",        # Axe chronologique
    "AUTEUR",       # Axe par auteur
    "LABORATOIRE",  # Axe par laboratoire / affiliation
]

_AXES_VALIDES = ("DISCIPLINE", "DOMAINE", "ANNEE", "AUTEUR", "LABORATOIRE")

# Libellé d'affichage pour chaque axe (navigation).
LIBELLES_AXES: dict[str, str] = {
    "DISCIPLINE": "Par discipline",
    "DOMAINE": "Par domaine d'application",
    "ANNEE": "Par année",
    "AUTEUR": "Par auteur",
    "LABORATOIRE": "Par laboratoire",
}


@dataclass(frozen=True)
class AxeOrganisation:
    """Value Object immuable représentant un axe de classement."""

    valeur: AxeValeur

    @classmethod
    def from_str(cls, v: str) -> "AxeOrganisation":
        v = v.upper()
        if v not in _AXES_VALIDES:
            raise ValueError(f"Axe d'organisation invalide : {v}")
        return cls(valeur=v)  # type: ignore[arg-type]

    @property
    def libelle(self) -> str:
        return LIBELLES_AXES[self.valeur]

    def __str__(self) -> str:
        return self.valeur
