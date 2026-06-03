from passlib.context import CryptContext

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class PasswordService:
    def hacher(self, mot_de_passe: str) -> str:
        return _pwd_context.hash(mot_de_passe)

    def verifier(self, mot_de_passe: str, hash_: str) -> bool:
        return _pwd_context.verify(mot_de_passe, hash_)
