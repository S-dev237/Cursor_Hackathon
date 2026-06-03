"""
Listener qui déclenche l'indexation RAG lorsqu'un FichierAjouteEvent est reçu.

Note : l'extraction du texte PDF (via PyMuPDF / pdfplumber) est faite ici
avant de passer le texte brut à IndexerRessourceUseCase.
"""
import io
from src.modules.document.domain.events.ressource_cree import FichierAjouteEvent
from ..adapters.lancedb_adapter import LanceDBAdapter
from ..adapters.openai_embedding_adapter import OpenAIEmbeddingAdapter
from ...domain.services.chunking_service import ChunkingService


class FichierAjouteRAGListener:
    def __init__(self, session_factory):
        self._session_factory = session_factory

    async def __call__(self, event: FichierAjouteEvent) -> None:
        from miniopy_async import Minio
        from src.shared.infrastructure.settings import get_settings
        from ...application.use_cases.indexer_ressource import IndexerRessourceUseCase, IndexerRessourceCommand
        from ..persistence.repository import SQLModelChunkRepository
        import uuid
        import pdfplumber

        settings = get_settings()
        try:
            minio = Minio(
                endpoint=settings.minio_endpoint,
                access_key=settings.minio_access_key,
                secret_key=settings.minio_secret_key,
                secure=settings.minio_secure,
            )
            response = await minio.get_object(event.minio_bucket, event.minio_key)
            pdf_bytes = await response.read()

            texte = ""
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    texte += (page.extract_text() or "") + "\n"

            async with self._session_factory() as session:
                uc = IndexerRessourceUseCase(
                    chunker=ChunkingService(),
                    embedding=OpenAIEmbeddingAdapter(),
                    vecteur_store=LanceDBAdapter(),
                    chunk_repo=SQLModelChunkRepository(session),
                )
                await uc.execute(IndexerRessourceCommand(
                    ressource_id=uuid.UUID(event.ressource_id),
                    texte_brut=texte,
                ))
        except Exception:
            pass  # Indexation asynchrone, non bloquante
