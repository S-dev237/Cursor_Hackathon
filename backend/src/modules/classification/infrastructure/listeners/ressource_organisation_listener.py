"""
Listener qui construit automatiquement les dossiers virtuels d'une ressource
nouvellement créée : PDF → métadonnées → Prolog → classements automatiques.

S'abonne à RessourceCreeEvent. Non bloquant : un échec d'organisation ne doit
jamais empêcher la création de la ressource.
"""
import uuid
from src.modules.document.domain.events.ressource_cree import RessourceCreeEvent
from ..adapters.moteur_organisation_prolog import MoteurOrganisationProlog
from ..persistence.repository import SQLModelDossierVirtuelRepository
from ...application.use_cases.organiser_ressource import (
    OrganiserRessourceUseCase, OrganiserRessourceCommand,
)


class RessourceCreeOrganisationListener:
    def __init__(self, session_factory):
        self._session_factory = session_factory
        self._moteur = MoteurOrganisationProlog()

    async def __call__(self, event: RessourceCreeEvent) -> None:
        try:
            ressource_id = uuid.UUID(event.ressource_id)
            from src.modules.document.infrastructure.persistence.models import RessourceModel

            async with self._session_factory() as session:
                # Enrichit l'évènement avec les métadonnées persistées
                # (description, année) pour affiner l'inférence.
                model = await session.get(RessourceModel, ressource_id)
                description = model.description if model else None
                annee = model.annee if model else None

                uc = OrganiserRessourceUseCase(
                    moteur=self._moteur,
                    repo=SQLModelDossierVirtuelRepository(session),
                )
                await uc.execute(OrganiserRessourceCommand(
                    ressource_id=ressource_id,
                    titre=event.titre,
                    description=description,
                    annee=annee,
                ))
        except Exception:
            # Organisation automatique : best-effort, non bloquante.
            pass
