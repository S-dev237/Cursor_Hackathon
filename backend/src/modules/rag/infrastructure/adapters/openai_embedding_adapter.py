from typing import List
from openai import AsyncOpenAI
from ...domain.ports.embedding_port import IEmbeddingPort
from src.shared.infrastructure.settings import get_settings

settings = get_settings()


class OpenAIEmbeddingAdapter(IEmbeddingPort):
    def __init__(self):
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.embedding_model
        self._dim = settings.embedding_dim

    async def vectoriser(self, texte: str) -> List[float]:
        resp = await self._client.embeddings.create(input=texte, model=self._model)
        return resp.data[0].embedding

    async def vectoriser_batch(self, textes: List[str]) -> List[List[float]]:
        resp = await self._client.embeddings.create(input=textes, model=self._model)
        return [item.embedding for item in resp.data]

    @property
    def dimension(self) -> int:
        return self._dim
