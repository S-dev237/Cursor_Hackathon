from __future__ import annotations
from dataclasses import dataclass
from typing import Literal

TypeDocumentValeur = Literal[
    "COURS", "TD", "TP", "EXAMEN", "CORRECTION", "SUPPORT",
    "MEMOIRE", "THESE", "ARTICLE", "RAPPORT", "AUTRE"
]
_PEDAGOGIQUE = frozenset({"COURS", "TD", "TP", "EXAMEN", "CORRECTION", "SUPPORT"})
_SCIENTIFIQUE = frozenset({"MEMOIRE", "THESE", "ARTICLE", "RAPPORT"})


@dataclass(frozen=True)
class TypeDocument:
    valeur: TypeDocumentValeur

    @classmethod
    def from_str(cls, v: str) -> "TypeDocument":
        v = v.upper()
        all_values = _PEDAGOGIQUE | _SCIENTIFIQUE | {"AUTRE"}
        if v not in all_values:
            raise ValueError(f"Type de document invalide : '{v}'")
        return cls(valeur=v)  # type: ignore[arg-type]

    def est_ressource_pedagogique(self) -> bool:
        return self.valeur in _PEDAGOGIQUE

    def est_production_scientifique(self) -> bool:
        return self.valeur in _SCIENTIFIQUE

    def categorie(self) -> str:
        if self.est_ressource_pedagogique():
            return "RESSOURCE_PEDAGOGIQUE"
        if self.est_production_scientifique():
            return "PRODUCTION_SCIENTIFIQUE"
        return "AUTRE"

    def __str__(self) -> str:
        return self.valeur
