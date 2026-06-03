from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.infrastructure.database import get_async_session
from src.modules.iam.infrastructure.http.dependencies import get_current_user
from ..adapters.lancedb_adapter import LanceDBAdapter
from ..adapters.openai_embedding_adapter import OpenAIEmbeddingAdapter
from ..adapters.openai_llm_adapter import OpenAILLMAdapter
from ..persistence.repository import SQLModelChunkRepository
from ...domain.services.chunking_service import ChunkingService
from ...application.use_cases.poser_question import PoserQuestionUseCase, PoserQuestionCommand
from ...application.use_cases.recherche_semantique import RechercheSemantiqueUseCase, RechercheSemantiqueCommand
from .schemas import QuestionRequest, QuestionResponse, RechercheRequest, RechercheResponse, SourceDTO

router = APIRouter(prefix="/rag", tags=["RAG"])


def get_rag_deps(session: AsyncSession = Depends(get_async_session)):
    return {
        "embedding": OpenAIEmbeddingAdapter(),
        "vecteur_store": LanceDBAdapter(),
        "llm": OpenAILLMAdapter(),
        "chunk_repo": SQLModelChunkRepository(session),
        "chunker": ChunkingService(),
    }


@router.post("/question", response_model=QuestionResponse)
async def poser_question(body: QuestionRequest, deps=Depends(get_rag_deps)):
    uc = PoserQuestionUseCase(
        embedding=deps["embedding"],
        vecteur_store=deps["vecteur_store"],
        llm=deps["llm"],
    )
    resultat = await uc.execute(PoserQuestionCommand(
        question=body.question,
        nb_contextes=body.nb_contextes,
    ))
    return QuestionResponse(
        reponse=resultat.reponse,
        sources=[
            SourceDTO(chunk_id=s.chunk_id, ressource_id=s.ressource_id, contenu=s.contenu, score=s.score)
            for s in resultat.sources
        ],
    )


@router.post("/recherche", response_model=list[RechercheResponse])
async def recherche_semantique(body: RechercheRequest, deps=Depends(get_rag_deps)):
    uc = RechercheSemantiqueUseCase(embedding=deps["embedding"], vecteur_store=deps["vecteur_store"])
    resultats = await uc.execute(RechercheSemantiqueCommand(requete=body.requete, limite=body.limite))
    return [
        RechercheResponse(
            chunk_id=r.chunk_id,
            ressource_id=r.ressource_id,
            contenu=r.contenu,
            score=r.score,
        )
        for r in resultats
    ]
