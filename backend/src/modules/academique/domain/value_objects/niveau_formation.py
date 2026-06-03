from __future__ import annotations
from dataclasses import dataclass
from typing import Literal

NiveauFormationValeur = Literal["L1", "L2", "L3", "M1", "M2", "D"]
_VALEURS = ("L1", "L2", "L3", "M1", "M2", "D")
_ORDRE = {v: i for i, v in enumerate(_VALEURS)}


@dataclass(frozen=True)
class NiveauFormation:
    valeur: NiveauFormationValeur

    @classmethod
    def from_str(cls, v: str) -> "NiveauFormation":
        if v not in _VALEURS:
            raise ValueError(f"Niveau invalide : '{v}'. Valeurs : {_VALEURS}")
        return cls(valeur=v)  # type: ignore[arg-type]

    def est_superieur_a(self, autre: "NiveauFormation") -> bool:
        return _ORDRE[self.valeur] > _ORDRE[autre.valeur]

    def __str__(self) -> str:
        return self.valeur
