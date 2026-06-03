from typing import List
import httpx
from ...domain.ports.moteur_regles_port import IMoteurReglesPort
from src.shared.infrastructure.settings import get_settings

settings = get_settings()


class PrologAdapter(IMoteurReglesPort):
    """
    Adaptateur HTTP vers le serveur Prolog (SWI-Prolog + HTTP server).
    Le serveur Prolog expose une API REST minimale via library(http/thread_httpd).
    """

    def __init__(self, base_url: str | None = None):
        self._base_url = base_url or settings.prolog_url

    async def classifier(self, ressource_id: str, titre: str, mots_cles: List[str]) -> List[str]:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{self._base_url}/classifier",
                json={"ressource_id": ressource_id, "titre": titre, "mots_cles": mots_cles},
            )
            resp.raise_for_status()
            return resp.json().get("thematiques", [])

    async def recommander(self, ressource_id: str) -> List[str]:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{self._base_url}/recommander/{ressource_id}")
            resp.raise_for_status()
            return resp.json().get("recommandations", [])

    async def obtenir_prerequis(self, ue_code: str) -> List[str]:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{self._base_url}/prerequis/{ue_code}")
            resp.raise_for_status()
            return resp.json().get("prerequis", [])

    async def sante(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{self._base_url}/sante")
                return resp.status_code == 200
        except Exception:
            return False
