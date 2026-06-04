import hashlib
import json
import uuid
from datetime import datetime, timezone
from io import BytesIO
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile, status
from fastapi.responses import RedirectResponse, StreamingResponse
from sqlalchemy.orm import Session
import magic
from app.api.deps import get_current_user, require_role
from app.core.config import settings
from app.db.models import AuditLog, Item, OutboxEvent, User
from app.db.session import get_db
from app.schemas.item import ItemOut, ItemPatch
from app.services import progress, storage

router = APIRouter(prefix="/items", tags=["items"])

ALLOWED_MIME = {"application/pdf", "text/xml", "application/xml"}
MIME_EXTENSIONS = {"application/pdf": "pdf", "text/xml": "xml", "application/xml": "xml"}


def _detect_mime(buf: bytes) -> str:
    try:
        return magic.from_buffer(buf, mime=True) or "application/octet-stream"
    except Exception:
        return "application/octet-stream"


@router.post("", response_model=ItemOut, status_code=202)
def create_item(
    file: UploadFile = File(...),
    title: str | None = Form(default=None),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("author", "admin")),
) -> Item:
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    chunks: list[bytes] = []
    total = 0
    sha = hashlib.sha256()
    while True:
        chunk = file.file.read(1024 * 1024)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status_code=413, detail="File too large")
        sha.update(chunk)
        chunks.append(chunk)
    if total == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    data = b"".join(chunks)
    mime = _detect_mime(data[:8192])
    if mime not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail=f"Unsupported media type: {mime}")
    sha_hex = sha.hexdigest()

    existing = (
        db.query(Item)
        .filter(Item.file_sha256 == sha_hex, Item.submitter_id == user.id, Item.status != "deleting")
        .first()
    )
    if existing:
        return existing

    item_id = uuid.uuid4()
    ext = MIME_EXTENSIONS[mime]
    key = f"items/{item_id}/source.{ext}"

    item = Item(
        id=item_id,
        submitter_id=user.id,
        title=title or file.filename or "Untitled",
        status="draft",
        file_filename=file.filename,
        file_mime_type=mime,
        file_size_bytes=total,
        file_sha256=sha_hex,
        vector_status="pending",
    )
    db.add(item)
    db.add(OutboxEvent(aggregate_id=item_id, type="item.ingest_requested", payload={"key": key}))
    db.add(AuditLog(actor_id=user.id, action="item.upload", entity_type="item", entity_id=str(item_id),
                    details={"filename": file.filename, "size": total, "mime": mime}))
    db.commit()

    try:
        storage.ensure_bucket()
        storage.upload_stream(key, BytesIO(data), length=total, content_type=mime)
    except Exception as exc:
        item.vector_status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {exc}") from exc

    item.file_storage_key = key
    item.file_uploaded_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(item)
    progress.publish(item_id, stage="queued", filename=file.filename)
    return item


@router.get("/{item_id}", response_model=ItemOut)
def get_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> Item:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if item.status != "published":
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.get("/{item_id}/owner", response_model=ItemOut)
def get_item_owner(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Item:
    """Vue propriétaire : permet de lire un draft."""
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if item.submitter_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return item


@router.get("/{item_id}/ingest-status")
async def ingest_status(
    item_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if item.submitter_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    def event_stream():
        snap = progress.last_snapshot(item_id)
        if snap:
            yield f"data: {json.dumps(snap)}\n\n"
        if item.vector_status == "indexed":
            yield f"data: {json.dumps({'item_id': str(item_id), 'stage': 'indexed', 'status': 'ok'})}\n\n"
            return
        for event in progress.subscribe(item_id, timeout=1.0):
            if event.get("_heartbeat"):
                yield ": ping\n\n"
                continue
            yield f"data: {json.dumps(event)}\n\n"
            if event.get("stage") in {"indexed", "failed"}:
                break

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.patch("/{item_id}", response_model=ItemOut)
def patch_item(
    item_id: uuid.UUID,
    payload: ItemPatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Item:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if item.submitter_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    if item.status == "deleting":
        raise HTTPException(status_code=409, detail="Item being deleted")

    updates = payload.model_dump(exclude_unset=True, exclude={"keywords", "authors"})
    for field, value in updates.items():
        setattr(item, field, value)

    if payload.keywords is not None:
        from app.db.models import ItemKeyword
        db.query(ItemKeyword).filter(ItemKeyword.item_id == item.id).delete()
        seen: set[str] = set()
        for kw in payload.keywords:
            k = str(kw).strip()[:200]
            if k and k not in seen:
                db.add(ItemKeyword(item_id=item.id, keyword=k))
                seen.add(k)

    if payload.authors is not None:
        from app.db.models import Author, ItemAuthor
        db.query(ItemAuthor).filter(ItemAuthor.item_id == item.id).delete()
        for i, a in enumerate(payload.authors):
            author = Author(
                family_name=a.family_name,
                given_name=a.given_name,
                affiliation=a.affiliation,
                orcid=a.orcid,
            )
            db.add(author)
            db.flush()
            db.add(ItemAuthor(item_id=item.id, author_id=author.id, position=i))

    db.add(OutboxEvent(aggregate_id=item.id, type="item.reindex_requested", payload={}))
    db.add(AuditLog(actor_id=user.id, action="item.update", entity_type="item", entity_id=str(item.id)))
    db.commit()
    db.refresh(item)
    return item


@router.post("/{item_id}/publish", response_model=ItemOut)
def publish_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Item:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if item.submitter_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    if item.status == "deleting":
        raise HTTPException(status_code=409, detail="Item being deleted")
    if not item.file_storage_key:
        raise HTTPException(status_code=409, detail="Cannot publish: source file not stored")
    item.status = "published"
    item.published_at = datetime.now(timezone.utc)
    db.add(OutboxEvent(aggregate_id=item.id, type="item.reindex_requested", payload={}))
    db.add(AuditLog(actor_id=user.id, action="item.publish", entity_type="item", entity_id=str(item.id)))
    db.commit()
    db.refresh(item)
    return item


@router.post("/{item_id}/withdraw", response_model=ItemOut)
def withdraw_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Item:
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    if item.submitter_id != user.id and user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    item.status = "withdrawn"
    db.add(OutboxEvent(aggregate_id=item.id, type="item.reindex_requested", payload={}))
    db.add(AuditLog(actor_id=user.id, action="item.withdraw", entity_type="item", entity_id=str(item.id)))
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("admin")),
):
    item = db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    item.status = "deleting"
    db.add(OutboxEvent(
        aggregate_id=item.id,
        type="item.delete_requested",
        payload={"key": item.file_storage_key},
    ))
    db.add(AuditLog(actor_id=user.id, action="item.delete", entity_type="item", entity_id=str(item.id)))
    db.commit()
    return None


@router.get("/{item_id}/download")
def download_item(
    item_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    item = db.get(Item, item_id)
    if not item or item.status != "published" or not item.file_storage_key:
        raise HTTPException(status_code=404, detail="Not found")
    item.download_count += 1
    db.commit()
    url = storage.presigned_get_url(item.file_storage_key, filename=item.file_filename)
    return RedirectResponse(url=url, status_code=status.HTTP_302_FOUND)
