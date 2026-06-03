from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlmodel import SQLModel
from .settings import get_settings
from typing import AsyncGenerator

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def create_db_and_tables() -> None:
    """Crée tous les schemas et tables au démarrage (dev/test uniquement)."""
    async with engine.begin() as conn:
        # Création des schemas PostgreSQL
        for schema in ("iam", "academique", "document", "classification", "rag", "usage"):
            await conn.exec_driver_sql(f"CREATE SCHEMA IF NOT EXISTS {schema}")
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency FastAPI pour injecter la session DB."""
    async with async_session_factory() as session:
        yield session
