from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "OpenScience Hub"
    APP_ENV: str = "dev"
    APP_DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: str = "http://localhost:3000"

    JWT_SECRET_KEY: str = "change-me"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    BCRYPT_ROUNDS: int = 12

    DATABASE_URL: str

    REDIS_URL: str = "redis://redis:6379/0"
    CELERY_BROKER_URL: str = "redis://redis:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/2"

    MINIO_ENDPOINT: str = "minio:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "openscience"
    MINIO_SECURE: bool = False
    MINIO_PRESIGN_TTL_SECONDS: int = 900

    QDRANT_URL: str = "http://qdrant:6333"
    QDRANT_API_KEY: str = ""
    QDRANT_COLLECTION: str = "items"
    QDRANT_VECTOR_SIZE: int = 1024

    LLM_PROVIDER: str = "hf"
    HF_API_TOKEN: str = ""
    HF_EMBEDDING_MODEL: str = "BAAI/bge-m3"
    HF_LLM_MODEL: str = "mistralai/Mistral-Small-24B-Instruct-2501"

    MAX_UPLOAD_MB: int = 100

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
