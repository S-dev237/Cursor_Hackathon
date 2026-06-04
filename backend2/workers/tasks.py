"""Celery tasks — outbox draining, ingestion pipeline, reindex, deletion saga.

Pipeline d'ingestion (déclenché par outbox `item.ingest_requested`) :
  1. fetch binaire depuis MinIO
  2. extraction texte (PyMuPDF ou lxml)
  3. extraction métadonnées via LLM (avec retries)
  4. embedding via HF Inference API
  5. upsert Qdrant + maj Postgres
À chaque étape, événement publié sur Redis pour SSE.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from app.db.models import Author, Item, ItemAuthor, ItemKeyword, OutboxEvent
from app.db.session import SessionLocal
from app.services import extraction, llm, progress, storage, vectors
from app.workers.celery_app import celery_app


# ---------------------------------------------------------------- helpers ---


def _qdrant_payload(item: Item, db) -> dict:
    keywords = [k.keyword for k in db.query(ItemKeyword).filter(ItemKeyword.item_id == item.id).all()]
    authors_rows = (
        db.query(Author, ItemAuthor)
        .join(ItemAuthor, ItemAuthor.author_id == Author.id)
        .filter(ItemAuthor.item_id == item.id)
        .order_by(ItemAuthor.position)
        .all()
    )
    authors = [f"{a.family_name}, {a.given_name}" for a, _ in authors_rows]
    return {
        "item_id": str(item.id),
        "title": item.title,
        "authors": authors,
        "year": item.publication_year,
        "type": item.resource_type,
        "language": item.language,
        "keywords": keywords,
        "status": item.status,
        "updated_at": (item.updated_at or datetime.now(timezone.utc)).isoformat(),
    }


def _apply_extracted_metadata(item: Item, meta: dict, db) -> None:
    if not meta:
        return
    if (t := meta.get("title")):
        item.title = str(t)[:500]
    if (a := meta.get("abstract")):
        item.abstract = str(a)[:5000]
    if (lang := meta.get("language")):
        item.language = str(lang)[:2]
    if (rt := meta.get("resource_type")):
        item.resource_type = str(rt)[:100]
    if (yr := meta.get("publication_year")):
        try:
            item.publication_year = int(yr)
        except (TypeError, ValueError):
            pass
    item.ai_extracted_at = datetime.now(timezone.utc)
    item.ai_confidence = 0.80

    db.query(ItemKeyword).filter(ItemKeyword.item_id == item.id).delete()
    seen: set[str] = set()
    for kw in (meta.get("keywords") or []):
        k = str(kw).strip()[:200]
        if k and k not in seen:
            db.add(ItemKeyword(item_id=item.id, keyword=k))
            seen.add(k)

    db.query(ItemAuthor).filter(ItemAuthor.item_id == item.id).delete()
    for i, a in enumerate(meta.get("authors") or []):
        if not isinstance(a, dict):
            continue
        author = Author(
            family_name=str(a.get("family_name") or "?")[:200],
            given_name=str(a.get("given_name") or "?")[:200],
            affiliation=(str(a["affiliation"])[:300] if a.get("affiliation") else None),
            orcid=(str(a["orcid"])[:50] if a.get("orcid") else None),
        )
        db.add(author)
        db.flush()
        db.add(ItemAuthor(item_id=item.id, author_id=author.id, position=i))


# ---------------------------------------------------------------- tasks -----


@celery_app.task(
    name="app.workers.tasks.ingest_pdf",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_backoff_max=120,
    retry_jitter=True,
    max_retries=3,
)
def ingest_pdf(self, item_id: str) -> None:
    db = SessionLocal()
    uid = uuid.UUID(item_id)
    try:
        item = db.get(Item, uid)
        if not item:
            return
        if item.vector_status == "indexed":
            return
        if not item.file_storage_key or not storage.object_exists(item.file_storage_key):
            progress.publish(uid, stage="failed", status="error", reason="source_missing")
            item.vector_status = "failed"
            db.commit()
            return

        progress.publish(uid, stage="fetching")
        data = storage.get_bytes(item.file_storage_key)

        text, method = extraction.extract_text(data, item.file_mime_type)
        if len(text) < extraction.MIN_TEXT_THRESHOLD:
            progress.publish(uid, stage="failed", status="error", reason="text_too_short", chars=len(text))
            item.vector_status = "failed"
            db.commit()
            return
        progress.publish(uid, stage="text_extracted", method=method, chars=len(text))

        try:
            meta = llm.get_llm_provider().extract_metadata(text)
            _apply_extracted_metadata(item, meta, db)
            db.commit()
            db.refresh(item)
            progress.publish(uid, stage="metadata_extracted",
                             title=item.title, year=item.publication_year)
        except Exception as exc:
            progress.publish(uid, stage="metadata_extracted", status="warning", reason=str(exc)[:200])

        embed_input = f"{item.title}\n{item.abstract or ''}\n{text[:1500]}"
        vector = llm.get_embedding_provider().embed(embed_input)
        progress.publish(uid, stage="embedded", dim=len(vector))

        vectors.ensure_collection()
        vectors.upsert_item(item.id, vector, _qdrant_payload(item, db))

        item.vector_status = "indexed"
        item.vector_indexed_at = datetime.now(timezone.utc)
        item.embedding_model = "bge-m3-v1.5"
        db.commit()
        progress.publish(uid, stage="indexed")
    except Exception as exc:
        db.rollback()
        progress.publish(uid, stage="retrying", status="warning",
                         reason=str(exc)[:200], attempt=self.request.retries + 1)
        item = db.get(Item, uid)
        if item and self.request.retries + 1 >= self.max_retries:
            item.vector_status = "failed"
            db.commit()
            progress.publish(uid, stage="failed", status="error", reason=str(exc)[:200])
        raise
    finally:
        db.close()


@celery_app.task(
    name="app.workers.tasks.reindex_item",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def reindex_item(self, item_id: str) -> None:
    """Met à jour le payload (et le vecteur si métadonnées modifiées) dans Qdrant.

    Si l'item est withdrawn/deleting → retire le point Qdrant.
    """
    db = SessionLocal()
    uid = uuid.UUID(item_id)
    try:
        item = db.get(Item, uid)
        if not item:
            return
        if item.status in {"withdrawn", "deleting"}:
            try:
                vectors.delete_item(uid)
            except Exception as exc:
                print(f"[reindex] qdrant delete failed: {exc}")
            return

        text = f"{item.title}\n{item.abstract or ''}"
        vector = llm.get_embedding_provider().embed(text)
        vectors.ensure_collection()
        vectors.upsert_item(item.id, vector, _qdrant_payload(item, db))
        item.vector_status = "indexed"
        item.vector_indexed_at = datetime.now(timezone.utc)
        db.commit()
        progress.publish(uid, stage="indexed", reindex=True)
    finally:
        db.close()


@celery_app.task(
    name="app.workers.tasks.purge_item",
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
)
def purge_item(self, item_id: str, file_key: str | None = None) -> None:
    """Saga compensatoire idempotente : Qdrant → MinIO → DELETE Postgres."""
    db = SessionLocal()
    uid = uuid.UUID(item_id)
    try:
        try:
            vectors.delete_item(uid)
        except Exception as exc:
            print(f"[purge] qdrant delete failed (ignored): {exc}")
        item = db.get(Item, uid)
        key = file_key or (item.file_storage_key if item else None)
        if key:
            try:
                storage.delete_object(key)
            except Exception as exc:
                print(f"[purge] minio delete failed (ignored): {exc}")
        if item:
            db.delete(item)
            db.commit()
    finally:
        db.close()


@celery_app.task(name="app.workers.tasks.drain_outbox")
def drain_outbox(batch: int = 50) -> int:
    """Consomme les événements outbox 'pending' et dispatche les tâches."""
    db = SessionLocal()
    processed = 0
    try:
        events = (
            db.execute(
                select(OutboxEvent)
                .where(OutboxEvent.status == "pending")
                .order_by(OutboxEvent.created_at.asc())
                .limit(batch)
            )
            .scalars()
            .all()
        )
        for ev in events:
            try:
                if ev.type == "item.ingest_requested":
                    ingest_pdf.delay(str(ev.aggregate_id))
                elif ev.type == "item.reindex_requested":
                    reindex_item.delay(str(ev.aggregate_id))
                elif ev.type == "item.delete_requested":
                    purge_item.delay(str(ev.aggregate_id), (ev.payload or {}).get("key"))
                else:
                    ev.status = "failed"
                    ev.last_error = f"unknown event type {ev.type}"
                    continue
                ev.status = "processed"
                ev.processed_at = datetime.now(timezone.utc)
            except Exception as exc:
                ev.attempts += 1
                ev.last_error = str(exc)[:500]
                if ev.attempts >= 5:
                    ev.status = "failed"
            processed += 1
        db.commit()
    finally:
        db.close()
    return processed


@celery_app.task(name="app.workers.tasks.reconcile_pending")
def reconcile_pending() -> None:
    """Rattrape les items bloqués (cf. docs §3)."""
    db = SessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
        pending = (
            db.query(Item)
            .filter(Item.vector_status == "pending", Item.created_at < cutoff)
            .all()
        )
        for item in pending:
            ingest_pdf.delay(str(item.id))
        deleting = db.query(Item).filter(Item.status == "deleting").all()
        for item in deleting:
            purge_item.delay(str(item.id), item.file_storage_key)
    finally:
        db.close()
