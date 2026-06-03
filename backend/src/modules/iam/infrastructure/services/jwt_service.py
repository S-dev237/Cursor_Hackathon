from datetime import datetime, timedelta, timezone
from typing import Optional
import uuid
from jose import jwt, JWTError
from src.shared.infrastructure.settings import get_settings

settings = get_settings()


class JWTService:
    def creer_token(self, utilisateur_id: str, email: str, type_user: str) -> str:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
        payload = {
            "sub": utilisateur_id,
            "email": email,
            "type": type_user,
            "exp": expire,
            "jti": str(uuid.uuid4()),
        }
        return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)

    def decoder_token(self, token: str) -> Optional[dict]:
        try:
            return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        except JWTError:
            return None
