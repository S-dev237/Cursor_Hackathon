from src.modules.document.domain.events.ressource_cree import RessourceCreeEvent
from ..adapters.prolog_adapter import PrologAdapter


class RessourceCreeClassificationListener:
    """
    Déclenche la classification Prolog automatique lorsqu'une Ressource est créée.
    S'abonne à RessourceCreeEvent via l'EventBus.
    """

    def __init__(self, prolog: PrologAdapter):
        self._prolog = prolog

    async def __call__(self, event: RessourceCreeEvent) -> None:
        try:
            await self._prolog.classifier(
                ressource_id=event.ressource_id,
                titre=event.titre,
                mots_cles=[],
            )
        except Exception:
            # Classification échouée : non bloquant, loggué séparément
            pass
