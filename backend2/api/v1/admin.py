import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.api.deps import require_role
from app.db.models import AuditLog, User
from app.db.session import get_db
from app.schemas.auth import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


class UserPatch(BaseModel):
    role: str | None = None
    is_active: bool | None = None


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _: User = Depends(require_role("admin"))):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch("/users/{user_id}", response_model=UserOut)
def patch_user(
    user_id: uuid.UUID,
    payload: UserPatch,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


@router.get("/audit")
def list_audit(db: Session = Depends(get_db), _: User = Depends(require_role("admin")), limit: int = 100):
    rows = db.query(AuditLog).order_by(AuditLog.ts.desc()).limit(limit).all()
    return [
        {"id": r.id, "ts": r.ts, "actor_id": r.actor_id, "action": r.action, "entity_type": r.entity_type, "entity_id": r.entity_id, "details": r.details}
        for r in rows
    ]
