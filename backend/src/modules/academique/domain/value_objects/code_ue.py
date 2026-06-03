from __future__ import annotations
import re
from dataclasses import dataclass
from src.shared.domain.result import Result


@dataclass(frozen=True)
class CodeUE:
    valeur: str

    _PATTERN = re.compile(r'^[A-Z]{2,5}\d{3,5}$')

    @classmethod
    def creer(cls, valeur: str) -> Result["CodeUE", str]:
        v = valeur.strip().upper()
        if not cls._PATTERN.match(v):
            return Result.fail(f"Code UE invalide : '{valeur}'. Format attendu : INF431")
        return Result.ok(cls(valeur=v))

    def __str__(self) -> str:
        return self.valeur
