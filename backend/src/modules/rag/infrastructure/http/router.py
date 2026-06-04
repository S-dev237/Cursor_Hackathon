import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.infrastructure.database import get_async_session
from src.shared.infrastructure.settings import get_settings
from src.modules.iam.infrastructure.http.dependencies import get_current_user
from ..adapters.qdrant_adapter import QdrantAdapter
from ..adapters.openai_embedding_adapter import OpenAIEmbeddingAdapter
from ..adapters.openai_llm_adapter import OpenAILLMAdapter
from ..persistence.repository import SQLModelChunkRepository
from ...domain.services.chunking_service import ChunkingService
from ...application.use_cases.poser_question import PoserQuestionUseCase, PoserQuestionCommand
from ...application.use_cases.recherche_semantique import RechercheSemantiqueUseCase, RechercheSemantiqueCommand
from .schemas import QuestionRequest, QuestionResponse, RechercheRequest, RechercheResponse, SourceDTO

router = APIRouter(prefix="/rag", tags=["RAG"])
logger = logging.getLogger("acadoc.rag")

_INDISPONIBLE = (
    "L'assistant IA n'est pas disponible sur ce serveur : la recherche "
    "sémantique requiert une clé OpenAI et un index vectoriel configurés."
)


def _verifier_disponibilite() -> None:
    """Renvoie une erreur claire (503) si le RAG n'est pas configuré, plutôt
    qu'une 500 opaque côté mobile."""
    if not get_settings().openai_api_key:
        raise HTTPException(status_code=503, detail=_INDISPONIBLE)


def get_rag_deps(session: AsyncSession = Depends(get_async_session)):
    return {
        "embedding": OpenAIEmbeddingAdapter(),
        "vecteur_store": QdrantAdapter(),
        "llm": OpenAILLMAdapter(),
        "chunk_repo": SQLModelChunkRepository(session),
        "chunker": ChunkingService(),
    }


@router.post("/question", response_model=QuestionResponse)
async def poser_question(
    body: QuestionRequest,
    session: AsyncSession = Depends(get_async_session),
):
    _verifier_disponibilite()
    try:
        uc = PoserQuestionUseCase(
            embedding=OpenAIEmbeddingAdapter(),
            vecteur_store=QdrantAdapter(),
            llm=OpenAILLMAdapter(),
        )
        resultat = await uc.execute(PoserQuestionCommand(
            question=body.question,
            nb_contextes=body.nb_contextes,
        ))
    except HTTPException:
        raise
    except Exception:
        logger.exception("Échec de la question RAG")
        raise HTTPException(status_code=503, detail=_INDISPONIBLE)
    return QuestionResponse(
        reponse=resultat.reponse,
        sources=[
            SourceDTO(chunk_id=s.chunk_id, ressource_id=s.ressource_id, contenu=s.contenu, score=s.score)
            for s in resultat.sources
        ],
    )


@router.post("/recherche", response_model=list[RechercheResponse])
async def recherche_semantique(
    body: RechercheRequest,
    session: AsyncSession = Depends(get_async_session),
):
    _verifier_disponibilite()
    try:
        uc = RechercheSemantiqueUseCase(
            embedding=OpenAIEmbeddingAdapter(), vecteur_store=QdrantAdapter()
        )
        resultats = await uc.execute(RechercheSemantiqueCommand(requete=body.requete, limite=body.limite))
    except HTTPException:
        raise
    except Exception:
        logger.exception("Échec de la recherche sémantique")
        raise HTTPException(status_code=503, detail=_INDISPONIBLE)
    return [
        RechercheResponse(
            chunk_id=r.chunk_id,
            ressource_id=r.ressource_id,
            contenu=r.contenu,
            score=r.score,
        )
        for r in resultats
    ]
