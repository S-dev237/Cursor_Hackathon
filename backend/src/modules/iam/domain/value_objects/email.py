from __future__ import annotations
import re
from dataclasses import dataclass
from src.shared.domain.result import Result


@dataclass(frozen=True)
class Email:
    valeur: str

    _PATTERN = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

    @classmethod
    def creer(cls, valeur: str) -> Result["Email", str]:
        v = valeur.strip().lower()
        if not v:
            return Result.fail("L'email ne peut pas être vide")
        if not cls._PATTERN.match(v):
            return Result.fail(f"Format email invalide : {valeur}")
        if len(v) > 320:
            return Result.fail("Email trop long (max 320 caractères)")
        return Result.ok(cls(valeur=v))
