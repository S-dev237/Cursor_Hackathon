import bcrypt

# Utilisation directe de `bcrypt` plutôt que `passlib` : les versions récentes
# de bcrypt (>=4.1) sont incompatibles avec la détection de bug de passlib
# (« password cannot be longer than 72 bytes »). bcrypt tronque déjà au-delà
# de 72 octets, on s'aligne explicitement pour rester déterministe.

_MAX_BYTES = 72


def _prepare(mot_de_passe: str) -> bytes:
    return mot_de_passe.encode("utf-8")[:_MAX_BYTES]


class PasswordService:
    def hacher(self, mot_de_passe: str) -> str:
        return bcrypt.hashpw(_prepare(mot_de_passe), bcrypt.gensalt()).decode("utf-8")

    def verifier(self, mot_de_passe: str, hash_: str) -> bool:
        try:
            return bcrypt.checkpw(_prepare(mot_de_passe), hash_.encode("utf-8"))
        except (ValueError, TypeError):
            return False
