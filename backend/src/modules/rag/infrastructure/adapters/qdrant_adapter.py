from typing import List
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from ...domain.ports.vecteur_store_port import IVecteurStorePort, ResultatRecherche
from src.shared.infrastructure.settings import get_settings

settings = get_settings()


class QdrantAdapter(IVecteurStorePort):
    """
    Adaptateur Qdrant pour le stockage et la recherche vectorielle.
    Nécessite un serveur Qdrant accessible via QDRANT_URL.
    """
    _COLLECTION_NAME = "chunks"

    def __init__(self):
        self._client = AsyncQdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )

    async def _ensure_collection(self) -> None:
        existing = await self._client.get_collections()
        names = [c.name for c in existing.collections]
        if self._COLLECTION_NAME not in names:
            await self._client.create_collection(
                collection_name=self._COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=settings.embedding_dim,
                    distance=Distance.COSINE,
                ),
            )

    async def indexer(self, chunk_id: str, ressource_id: str, contenu: str, vecteur: List[float]) -> None:
        await self._ensure_collection()
        await self._client.upsert(
            collection_name=self._COLLECTION_NAME,
            points=[
                PointStruct(
                    id=chunk_id,
                    vector=vecteur,
                    payload={
                        "ressource_id": ressource_id,
                        "contenu": contenu,
                    },
                )
            ],
        )

    async def rechercher(self, vecteur: List[float], limite: int = 5) -> List[ResultatRecherche]:
        await self._ensure_collection()
        results = await self._client.search(
            collection_name=self._COLLECTION_NAME,
            query_vector=vecteur,
            limit=limite,
            with_payload=True,
        )
        return [
            ResultatRecherche(
                chunk_id=str(r.id),
                ressource_id=r.payload["ressource_id"],
                contenu=r.payload["contenu"],
                score=float(r.score),
            )
            for r in results
        ]

    async def supprimer_ressource(self, ressource_id: str) -> None:
        await self._ensure_collection()
        await self._client.delete(
            collection_name=self._COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="ressource_id",
                        match=MatchValue(value=ressource_id),
                    )
                ]
            ),
        )
