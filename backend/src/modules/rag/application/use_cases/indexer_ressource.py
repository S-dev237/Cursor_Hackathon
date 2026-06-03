from dataclasses import dataclass
import uuid
from ...domain.services.chunking_service import ChunkingService
from ...domain.ports.vecteur_store_port import IVecteurStorePort
from ...domain.ports.embedding_port import IEmbeddingPort
from ...domain.repositories.chunk_repository import IChunkRepository


@dataclass(frozen=True)
class IndexerRessourceCommand:
    ressource_id: uuid.UUID
    texte_brut: str


class IndexerRessourceUseCase:
    def __init__(
        self,
        chunker: ChunkingService,
        embedding: IEmbeddingPort,
        vecteur_store: IVecteurStorePort,
        chunk_repo: IChunkRepository,
    ):
        self._chunker = chunker
        self._embedding = embedding
        self._vecteur_store = vecteur_store
        self._chunk_repo = chunk_repo

    async def execute(self, cmd: IndexerRessourceCommand) -> int:
        chunks = self._chunker.decouper(cmd.ressource_id, cmd.texte_brut)

        textes = [c.contenu for c in chunks]
        vecteurs = await self._embedding.vectoriser_batch(textes)

        await self._chunk_repo.sauvegarder_batch(chunks)

        for chunk, vecteur in zip(chunks, vecteurs):
            await self._vecteur_store.indexer(
                chunk_id=str(chunk.id),
                ressource_id=str(cmd.ressource_id),
                contenu=chunk.contenu,
                vecteur=vecteur,
            )

        return len(chunks)
