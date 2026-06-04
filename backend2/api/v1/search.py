import uuid
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.models import Item
from app.db.session import get_db
from app.schemas.item import ItemOut, SearchResult
from app.services import llm, storage, vectors

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=list[SearchResult])
def search(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    db: Session = Depends(get_db),
) -> list[SearchResult]:
    embedder = llm.get_embedding_provider()
    vector = embedder.embed(q)
    hits = vectors.search(vector, limit=limit, only_published=True)
    if not hits:
        return []
    ids = [uuid.UUID(h["id"]) for h in hits]
    items = {i.id: i for i in db.query(Item).filter(Item.id.in_(ids), Item.status == "published").all()}
    results: list[SearchResult] = []
    for h in hits:
        item = items.get(uuid.UUID(h["id"]))
        if not item:
            continue
        url = storage.presigned_get_url(item.file_storage_key) if item.file_storage_key else None
        results.append(SearchResult(item=ItemOut.model_validate(item), score=h["score"], download_url=url))
    return results
