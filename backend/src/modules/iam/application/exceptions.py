from src.shared.infrastructure.exceptions import ConflictException, ValidationException


class EmailDejaUtiliseException(ConflictException):
    def __init__(self, email: str):
        super().__init__(f"L'email '{email}' est déjà utilisé")


class IdentifiantsInvalidesException(ValidationException):
    def __init__(self):
        super().__init__("Email ou mot de passe incorrect")


class UtilisateurInactifException(ValidationException):
    def __init__(self):
        super().__init__("Ce compte est désactivé")
