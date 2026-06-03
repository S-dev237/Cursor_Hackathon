from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # PostgreSQL
    database_url: str = "postgresql+asyncpg://acadoc:secret@localhost:5432/acadoc"

    # JWT
    jwt_secret: str = "change_me_in_production_please"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 jours

    # MinIO
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "documents"
    minio_secure: bool = False

    # LanceDB
    lancedb_uri: str = "./data/lancedb"

    # OpenAI
    openai_api_key: str = ""
    embedding_model: str = "text-embedding-3-small"
    embedding_dim: int = 1536
    llm_model: str = "gpt-4o-mini"

    # Prolog
    prolog_url: str = "http://localhost:8081"

    # App
    debug: bool = False
    app_name: str = "Gestion Documents Académiques"
    app_version: str = "1.0.0"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
