from __future__ import annotations
from dataclasses import dataclass, field
from .domain_event import IDomainEvent


@dataclass
class AggregateRoot:
    """
    Classe de base pour tous les Aggregate Roots.
    Collecte les Domain Events avant de les publier via l'EventBus.
    """
    _domain_events: list[IDomainEvent] = field(
        default_factory=list, init=False, repr=False, compare=False
    )

    def _add_event(self, event: IDomainEvent) -> None:
        self._domain_events.append(event)

    @property
    def domain_events(self) -> list[IDomainEvent]:
        return list(self._domain_events)

    def clear_events(self) -> None:
        self._domain_events.clear()
