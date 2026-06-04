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
    # Endpoint public utilisé pour SIGNER les URLs de téléchargement servies au
    # client (mobile/web). Sur un téléphone, « localhost » désigne le téléphone
    # lui-même : il faut donc une adresse joignable depuis l'appareil.
    #   - Si vide, l'hôte est déduit de la requête entrante (ex. l'IP LAN que le
    #     mobile a utilisée pour joindre l'API) + `minio_public_port`.
    #   - Sinon, cette valeur explicite (ex. "cdn.exemple.com") est utilisée.
    minio_public_endpoint: str = ""
    minio_public_port: int = 9000
    minio_public_secure: bool = False
    # Région S3 explicite : évite un appel réseau « GetBucketLocation » lors de
    # la génération d'URLs présignées (sinon le client tente de joindre l'hôte
    # public — éventuellement injoignable depuis le serveur — et se bloque).
    minio_region: str = "us-east-1"

    # Qdrant
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str = ""

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

    # Admin interface
    admin_username: str = "admin"
    admin_password: str = "admin"
    admin_secret_key: str = "change_me_admin_secret_key"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    return Settings()
