from __future__ import annotations
import uuid
from dataclasses import dataclass


@dataclass
class MotCle:
    id: uuid.UUID
    terme: str

    @classmethod
    def creer(cls, terme: str) -> "MotCle":
        return cls(id=uuid.uuid4(), terme=terme.lower().strip())
