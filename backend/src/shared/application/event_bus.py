from abc import ABC, abstractmethod
from src.shared.domain.domain_event import IDomainEvent


class IEventBus(ABC):
    @abstractmethod
    async def publish(self, events: list[IDomainEvent]) -> None: ...

    @abstractmethod
    def subscribe(self, event_type: type, handler) -> None: ...
