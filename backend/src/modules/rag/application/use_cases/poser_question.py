from dataclasses import dataclass
from typing import List
from ...domain.ports.vecteur_store_port import IVecteurStorePort, ResultatRecherche
from ...domain.ports.embedding_port import IEmbeddingPort
from ...domain.ports.llm_port import ILLMPort


@dataclass(frozen=True)
class PoserQuestionCommand:
    question: str
    nb_contextes: int = 5


@dataclass
class ReponseRAGDTO:
    reponse: str
    sources: List[ResultatRecherche]


class PoserQuestionUseCase:
    def __init__(
        self,
        embedding: IEmbeddingPort,
        vecteur_store: IVecteurStorePort,
        llm: ILLMPort,
    ):
        self._embedding = embedding
        self._vecteur_store = vecteur_store
        self._llm = llm

    async def execute(self, cmd: PoserQuestionCommand) -> ReponseRAGDTO:
        vecteur = await self._embedding.vectoriser(cmd.question)
        resultats = await self._vecteur_store.rechercher(vecteur, limite=cmd.nb_contextes)

        contextes = [r.contenu for r in resultats]
        reponse = await self._llm.generer_reponse(cmd.question, contextes)

        return ReponseRAGDTO(reponse=reponse, sources=resultats)
