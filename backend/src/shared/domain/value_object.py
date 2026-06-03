from dataclasses import dataclass


@dataclass(frozen=True)
class ValueObject:
    """
    Classe de base pour les Value Objects.
    frozen=True garantit l'immuabilité et fournit __eq__ / __hash__ par valeur.
    """
    pass
