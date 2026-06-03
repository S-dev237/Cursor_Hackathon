from __future__ import annotations
from dataclasses import dataclass
from typing import Literal

OrigineValeur = Literal["MANUELLE", "PROLOG", "IA"]


@dataclass(frozen=True)
class OrigineClassification:
    valeur: OrigineValeur

    @classmethod
    def from_str(cls, v: str) -> "OrigineClassification":
        if v not in ("MANUELLE", "PROLOG", "IA"):
            raise ValueError(f"Origine invalide : {v}")
        return cls(valeur=v)  # type: ignore[arg-type]

    def __str__(self) -> str:
        return self.valeur
