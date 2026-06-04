"""Progression d'ingestion : publication via Redis pub/sub + dernier snapshot.

Étapes publiées :
  queued → fetching → text_extracted → metadata_extracted →
  embedded → indexed | failed
"""
from __future__ import annotations
import json
import time
import uuid
from collections.abc import Iterator
from typing import Any
import redis
from app.core.config import settings


_redis_client: redis.Redis | None = None


def _client() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


def _channel(item_id: uuid.UUID | str) -> str:
    return f"ingest:{item_id}:events"


def _snapshot_key(item_id: uuid.UUID | str) -> str:
    return f"ingest:{item_id}:last"


def publish(item_id: uuid.UUID | str, stage: str, status: str = "ok", **extra: Any) -> None:
    event = {"item_id": str(item_id), "stage": stage, "status": status, "ts": time.time(), **extra}
    payload = json.dumps(event)
    r = _client()
    pipe = r.pipeline()
    pipe.publish(_channel(item_id), payload)
    pipe.set(_snapshot_key(item_id), payload, ex=3600)
    pipe.execute()


def last_snapshot(item_id: uuid.UUID | str) -> dict | None:
    raw = _client().get(_snapshot_key(item_id))
    return json.loads(raw) if raw else None


def subscribe(item_id: uuid.UUID | str, timeout: float = 1.0) -> Iterator[dict]:
    """Yields events as they arrive. Generator stops when caller breaks."""
    pubsub = _client().pubsub()
    pubsub.subscribe(_channel(item_id))
    try:
        while True:
            msg = pubsub.get_message(ignore_subscribe_messages=True, timeout=timeout)
            if msg and msg.get("type") == "message":
                data = msg.get("data")
                if isinstance(data, (bytes, bytearray)):
                    data = data.decode()
                try:
                    yield json.loads(data)
                except (TypeError, ValueError):
                    continue
            else:
                yield {"_heartbeat": True}
    finally:
        try:
            pubsub.unsubscribe(_channel(item_id))
            pubsub.close()
        except Exception:
            pass
