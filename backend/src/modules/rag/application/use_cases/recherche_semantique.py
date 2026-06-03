from dataclasses import dataclass
from typing import List
from ...domain.ports.vecteur_store_port import IVecteurStorePort, ResultatRecherche
from ...domain.ports.embedding_port import IEmbeddingPort


@dataclass(frozen=True)
class RechercheSemantiqueCommand:
    requete: str
    limite: int = 10


class RechercheSemantiqueUseCase:
    def __init__(self, embedding: IEmbeddingPort, vecteur_store: IVecteurStorePort):
        self._embedding = embedding
        self._vecteur_store = vecteur_store

    async def execute(self, cmd: RechercheSemantiqueCommand) -> List[ResultatRecherche]:
        vecteur = await self._embedding.vectoriser(cmd.requete)
        return await self._vecteur_store.rechercher(vecteur, limite=cmd.limite)
