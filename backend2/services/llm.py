"""LLM + embeddings via HuggingFace Inference API.

Provider abstraction conforme à `docs/MVP_ARCHITECTURE.md` §7.
Retries automatiques sur erreurs réseau / 5xx via tenacity.
"""
from __future__ import annotations
import json
from typing import Protocol
import httpx
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)
from app.core.config import settings


HF_BASE = "https://api-inference.huggingface.co/models"
_RETRYABLE = (httpx.HTTPError, httpx.TransportError)


class EmbeddingProvider(Protocol):
    def embed(self, text: str) -> list[float]: ...


class LLMProvider(Protocol):
    def extract_metadata(self, text: str) -> dict: ...


class HFEmbeddingProvider:
    def __init__(self, model: str | None = None, token: str | None = None) -> None:
        self.model = model or settings.HF_EMBEDDING_MODEL
        self.token = token or settings.HF_API_TOKEN

    @retry(
        retry=retry_if_exception_type(_RETRYABLE),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(3),
        reraise=True,
    )
    def embed(self, text: str) -> list[float]:
        url = f"{HF_BASE}/{self.model}"
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        resp = httpx.post(
            url,
            headers=headers,
            json={"inputs": text, "options": {"wait_for_model": True}},
            timeout=60.0,
        )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and data and isinstance(data[0], list):
            return data[0]
        if isinstance(data, list) and all(isinstance(x, (int, float)) for x in data):
            return data  # type: ignore[return-value]
        raise ValueError(f"Unexpected embedding response shape: {type(data)}")


EXTRACTION_PROMPT = """Tu es un assistant d'extraction de métadonnées scientifiques.
Analyse l'extrait suivant et retourne UNIQUEMENT un JSON valide
conforme au schéma fourni. Si un champ est introuvable, mets null.
N'invente aucune donnée.

Texte:
\"\"\"{text}\"\"\"

Schéma:
{{
  "title": "string",
  "abstract": "string (1500 caractères max)",
  "language": "fr|en|...",
  "authors": [
    {{"family_name":"string","given_name":"string","affiliation":"string|null","orcid":"string|null"}}
  ],
  "keywords": ["string"],
  "resource_type": "thesis|master thesis|article|report",
  "publication_year": 2024
}}
"""


def _parse_json_lenient(raw: str) -> dict:
    start = raw.find("{")
    end = raw.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("No JSON object in LLM response")
    return json.loads(raw[start : end + 1])


class HFLLMProvider:
    def __init__(self, model: str | None = None, token: str | None = None) -> None:
        self.model = model or settings.HF_LLM_MODEL
        self.token = token or settings.HF_API_TOKEN

    @retry(
        retry=retry_if_exception_type((*_RETRYABLE, ValueError, json.JSONDecodeError)),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(2),
        reraise=True,
    )
    def extract_metadata(self, text: str) -> dict:
        url = f"{HF_BASE}/{self.model}"
        prompt = EXTRACTION_PROMPT.format(text=text[:6000])
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        payload = {
            "inputs": prompt,
            "parameters": {"max_new_tokens": 1024, "temperature": 0.1, "return_full_text": False},
            "options": {"wait_for_model": True},
        }
        resp = httpx.post(url, headers=headers, json=payload, timeout=120.0)
        resp.raise_for_status()
        data = resp.json()
        raw = data[0].get("generated_text", "") if isinstance(data, list) else str(data)
        return _parse_json_lenient(raw)


def get_embedding_provider() -> EmbeddingProvider:
    return HFEmbeddingProvider()


def get_llm_provider() -> LLMProvider:
    return HFLLMProvider()
