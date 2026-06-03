from typing import Callable, Awaitable
from src.shared.application.event_bus import IEventBus
from src.shared.domain.domain_event import IDomainEvent

Handler = Callable[[IDomainEvent], Awaitable[None]]


class SimpleEventBus(IEventBus):
    """
    Implémentation simple de l'EventBus en mémoire.
    Les handlers sont enregistrés au démarrage via subscribe().
    """

    def __init__(self):
        self._handlers: dict[type, list[Handler]] = {}

    def subscribe(self, event_type: type, handler: Handler) -> None:
        self._handlers.setdefault(event_type, []).append(handler)

    async def publish(self, events: list[IDomainEvent]) -> None:
        for event in events:
            handlers = self._handlers.get(type(event), [])
            for handler in handlers:
                await handler(event)


# Singleton partagé via FastAPI Depends
_bus = SimpleEventBus()


def get_event_bus() -> SimpleEventBus:
    return _bus
