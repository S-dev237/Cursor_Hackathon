from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.deps import get_current_user
from app.db.models import Item, User
from app.db.session import get_db
from app.schemas.item import ItemOut

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/items", response_model=list[ItemOut])
def list_my_items(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    status: str | None = Query(default=None, description="draft|published|withdrawn"),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[Item]:
    q = db.query(Item).filter(Item.submitter_id == user.id)
    if status:
        q = q.filter(Item.status == status)
    return q.order_by(Item.created_at.desc()).limit(limit).all()
