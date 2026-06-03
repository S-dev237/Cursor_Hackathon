from __future__ import annotations
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Protocol, runtime_checkable
import uuid


@runtime_checkable
class IDomainEvent(Protocol):
    event_id: str
    occurred_at: datetime


@dataclass(frozen=True)
class BaseDomainEvent:
    """Base immuable pour tous les Domain Events."""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    occurred_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
