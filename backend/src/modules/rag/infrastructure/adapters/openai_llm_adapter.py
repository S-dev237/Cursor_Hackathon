from typing import List
from openai import AsyncOpenAI
from ...domain.ports.llm_port import ILLMPort
from src.shared.infrastructure.settings import get_settings

settings = get_settings()

_SYSTEM_PROMPT = (
    "Tu es un assistant académique. Réponds en te basant UNIQUEMENT sur les extraits fournis. "
    "Si l'information n'est pas dans les extraits, dis-le clairement. "
    "Cite les sources en mentionnant l'ID du chunk."
)


class OpenAILLMAdapter(ILLMPort):
    def __init__(self):
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.llm_model

    async def generer_reponse(self, question: str, contextes: List[str]) -> str:
        contexte_str = "\n\n---\n\n".join(f"[Extrait {i+1}]\n{c}" for i, c in enumerate(contextes))
        messages = [
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Extraits :\n{contexte_str}\n\nQuestion : {question}"},
        ]
        resp = await self._client.chat.completions.create(
            model=self._model,
            messages=messages,
            temperature=0.2,
            max_tokens=1024,
        )
        return resp.choices[0].message.content or ""
