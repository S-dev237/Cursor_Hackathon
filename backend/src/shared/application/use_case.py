from typing import TypeVar, Generic
from abc import ABC, abstractmethod

I = TypeVar("I")
O = TypeVar("O")


class IUseCase(ABC, Generic[I, O]):
    """Interface générique pour tous les Use Cases."""

    @abstractmethod
    async def execute(self, command: I) -> O: ...
