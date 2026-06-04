from src.shared.infrastructure.exceptions import (
    AccessDeniedException,
    ConflictException,
    NotFoundException,
    UnauthorizedException,
)


class EmailDejaUtiliseException(ConflictException):
    def __init__(self, email: str):
        super().__init__(f"L'email '{email}' est déjà utilisé")


class UtilisateurIntrouvableException(NotFoundException):
    def __init__(self):
        super().__init__("Utilisateur introuvable")


class IdentifiantsInvalidesException(UnauthorizedException):
    def __init__(self):
        super().__init__("Email ou mot de passe incorrect")


class UtilisateurInactifException(AccessDeniedException):
    def __init__(self):
        super().__init__("Ce compte est désactivé")
