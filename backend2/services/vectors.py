import uuid
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from app.core.config import settings


def get_qdrant() -> QdrantClient:
    return QdrantClient(
        url=settings.QDRANT_URL,
        api_key=settings.QDRANT_API_KEY or None,
    )


def ensure_collection() -> None:
    client = get_qdrant()
    existing = {c.name for c in client.get_collections().collections}
    if settings.QDRANT_COLLECTION not in existing:
        client.create_collection(
            collection_name=settings.QDRANT_COLLECTION,
            vectors_config=VectorParams(size=settings.QDRANT_VECTOR_SIZE, distance=Distance.COSINE),
        )


def upsert_item(item_id: uuid.UUID, vector: list[float], payload: dict) -> None:
    client = get_qdrant()
    client.upsert(
        collection_name=settings.QDRANT_COLLECTION,
        points=[PointStruct(id=str(item_id), vector=vector, payload=payload)],
    )


def delete_item(item_id: uuid.UUID) -> None:
    client = get_qdrant()
    client.delete(collection_name=settings.QDRANT_COLLECTION, points_selector=[str(item_id)])


def search(vector: list[float], limit: int = 20, only_published: bool = True) -> list[dict]:
    client = get_qdrant()
    flt = None
    if only_published:
        flt = Filter(must=[FieldCondition(key="status", match=MatchValue(value="published"))])
    hits = client.search(
        collection_name=settings.QDRANT_COLLECTION,
        query_vector=vector,
        query_filter=flt,
        limit=limit,
        with_payload=True,
    )
    return [{"id": h.id, "score": h.score, "payload": h.payload} for h in hits]
