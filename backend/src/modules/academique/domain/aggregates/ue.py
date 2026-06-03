from __future__ import annotations
import uuid
from dataclasses import dataclass
from typing import Optional, Literal
from src.shared.domain.aggregate_root import AggregateRoot
from ..value_objects.code_ue import CodeUE

Semestre = Literal["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"]


@dataclass
class UE(AggregateRoot):
    id: uuid.UUID
    _code: CodeUE
    _nom: str
    _semestre: Semestre
    _formation_id: uuid.UUID
    _credits: Optional[int] = None
    _description: Optional[str] = None

    @classmethod
    def creer(
        cls,
        code: str,
        nom: str,
        semestre: Semestre,
        formation_id: uuid.UUID,
        credits: Optional[int] = None,
        description: Optional[str] = None,
    ) -> "UE":
        code_ue = CodeUE.creer(code).or_raise()
        return cls(
            id=uuid.uuid4(),
            _code=code_ue,
            _nom=nom,
            _semestre=semestre,
            _formation_id=formation_id,
            _credits=credits,
            _description=description,
        )

    @property
    def code(self) -> str:
        return self._code.valeur

    @property
    def nom(self) -> str:
        return self._nom

    @property
    def semestre(self) -> Semestre:
        return self._semestre

    @property
    def formation_id(self) -> uuid.UUID:
        return self._formation_id

    @property
    def credits(self) -> Optional[int]:
        return self._credits

    @property
    def description(self) -> Optional[str]:
        return self._description
