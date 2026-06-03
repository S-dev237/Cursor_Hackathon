from __future__ import annotations
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional


@dataclass
class Consultation:
    id: uuid.UUID
    ressource_id: uuid.UUID
    utilisateur_id: Optional[uuid.UUID]
    duree_secondes: Optional[int]
    created_at: datetime

    @classmethod
    def enregistrer(
        cls,
        ressource_id: uuid.UUID,
        utilisateur_id: Optional[uuid.UUID] = None,
        duree_secondes: Optional[int] = None,
    ) -> "Consultation":
        return cls(
            id=uuid.uuid4(),
            ressource_id=ressource_id,
            utilisateur_id=utilisateur_id,
            duree_secondes=duree_secondes,
            created_at=datetime.now(timezone.utc),
        )
