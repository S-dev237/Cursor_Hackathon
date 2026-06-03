from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.shared.infrastructure.settings import get_settings
from src.shared.infrastructure.database import create_db_and_tables
from src.shared.infrastructure.event_bus import get_event_bus

# Importation des modèles SQLModel (nécessaire pour la création des tables)
import src.modules.iam.infrastructure.persistence.models           # noqa: F401
import src.modules.academique.infrastructure.persistence.models    # noqa: F401
import src.modules.document.infrastructure.persistence.models      # noqa: F401
import src.modules.classification.infrastructure.persistence.models # noqa: F401
import src.modules.rag.infrastructure.persistence.models           # noqa: F401
import src.modules.usage.infrastructure.persistence.models         # noqa: F401

# Routeurs
from src.modules.iam.infrastructure.http.router import router as iam_router
from src.modules.academique.infrastructure.http.router import router as academique_router
from src.modules.document.infrastructure.http.router import router as document_router
from src.modules.classification.infrastructure.http.router import router as classification_router
from src.modules.rag.infrastructure.http.router import router as rag_router
from src.modules.usage.infrastructure.http.router import router as usage_router

# Listeners
from src.modules.classification.infrastructure.listeners.ressource_cree_listener import (
    RessourceCreeClassificationListener
)
from src.modules.classification.infrastructure.adapters.prolog_adapter import PrologAdapter
from src.modules.document.domain.events.ressource_cree import RessourceCreeEvent, FichierAjouteEvent

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Démarrage ──────────────────────────────────────────────────────
    await create_db_and_tables()

    # Enregistrement des listeners sur l'EventBus
    bus = get_event_bus()
    bus.subscribe(
        RessourceCreeEvent,
        RessourceCreeClassificationListener(prolog=PrologAdapter()),
    )
    # Le listener RAG est enregistré dynamiquement avec la session_factory
    from src.shared.infrastructure.database import async_session_factory
    from src.modules.rag.infrastructure.listeners.fichier_ajoute_listener import FichierAjouteRAGListener
    bus.subscribe(FichierAjouteEvent, FichierAjouteRAGListener(async_session_factory))

    yield
    # ── Arrêt ──────────────────────────────────────────────────────────


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="API de gestion de documents académiques — Architecture DDD",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Enregistrement des routes ───────────────────────────────────────
    app.include_router(iam_router,            prefix="/api/v1")
    app.include_router(academique_router,     prefix="/api/v1")
    app.include_router(document_router,       prefix="/api/v1")
    app.include_router(classification_router, prefix="/api/v1")
    app.include_router(rag_router,            prefix="/api/v1")
    app.include_router(usage_router,          prefix="/api/v1")

    @app.get("/", tags=["Santé"])
    async def sante():
        return {"status": "ok", "version": settings.app_version}

    @app.get("/health", tags=["Santé"])
    async def health():
        return {"status": "healthy"}

    return app
