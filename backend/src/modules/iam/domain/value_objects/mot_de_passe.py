from __future__ import annotations
from dataclasses import dataclass
from src.shared.domain.result import Result


@dataclass(frozen=True)
class MotDePasse:
    """Value Object pour le mot de passe en clair (avant hachage)."""
    valeur: str

    @classmethod
    def creer(cls, valeur: str) -> Result["MotDePasse", str]:
        if len(valeur) < 8:
            return Result.fail("Le mot de passe doit contenir au moins 8 caractères")
        if len(valeur) > 128:
            return Result.fail("Le mot de passe est trop long (max 128 caractères)")
        return Result.ok(cls(valeur=valeur))
