import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context
from sqlmodel import SQLModel

# Importer tous les modèles pour que Alembic les détecte
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import src.modules.iam.infrastructure.persistence.models           # noqa: F401
import src.modules.academique.infrastructure.persistence.models    # noqa: F401
import src.modules.document.infrastructure.persistence.models      # noqa: F401
import src.modules.classification.infrastructure.persistence.models # noqa: F401
import src.modules.rag.infrastructure.persistence.models           # noqa: F401
import src.modules.usage.infrastructure.persistence.models         # noqa: F401

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = create_async_engine(
        config.get_main_option("sqlalchemy.url"),
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
