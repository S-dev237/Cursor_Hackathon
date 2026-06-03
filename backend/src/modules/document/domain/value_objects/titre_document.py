from __future__ import annotations
from dataclasses import dataclass
from src.shared.domain.result import Result


@dataclass(frozen=True)
class TitreDocument:
    valeur: str

    @classmethod
    def creer(cls, valeur: str) -> Result["TitreDocument", str]:
        v = valeur.strip()
        if not v:
            return Result.fail("Le titre ne peut pas être vide")
        if len(v) > 500:
            return Result.fail("Titre trop long (max 500 caractères)")
        return Result.ok(cls(valeur=v))
