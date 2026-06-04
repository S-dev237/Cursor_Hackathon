"""Stockage objet MinIO — uploads streaming, presigned URLs."""
from __future__ import annotations
from datetime import timedelta
from io import BytesIO
from typing import BinaryIO
from minio import Minio
from minio.error import S3Error
from app.core.config import settings


def get_minio_client() -> Minio:
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


def ensure_bucket() -> None:
    client = get_minio_client()
    if not client.bucket_exists(settings.MINIO_BUCKET):
        client.make_bucket(settings.MINIO_BUCKET)


def upload_bytes(key: str, data: bytes, content_type: str = "application/octet-stream") -> None:
    client = get_minio_client()
    client.put_object(
        settings.MINIO_BUCKET,
        key,
        BytesIO(data),
        length=len(data),
        content_type=content_type,
    )


def upload_stream(
    key: str,
    stream: BinaryIO,
    length: int,
    content_type: str = "application/octet-stream",
) -> None:
    client = get_minio_client()
    client.put_object(
        settings.MINIO_BUCKET,
        key,
        stream,
        length=length,
        content_type=content_type,
        part_size=10 * 1024 * 1024,
    )


def get_bytes(key: str) -> bytes:
    client = get_minio_client()
    resp = client.get_object(settings.MINIO_BUCKET, key)
    try:
        return resp.read()
    finally:
        resp.close()
        resp.release_conn()


def object_exists(key: str) -> bool:
    client = get_minio_client()
    try:
        client.stat_object(settings.MINIO_BUCKET, key)
        return True
    except S3Error:
        return False


def delete_object(key: str) -> None:
    client = get_minio_client()
    try:
        client.remove_object(settings.MINIO_BUCKET, key)
    except S3Error:
        pass


def presigned_get_url(key: str, filename: str | None = None) -> str:
    client = get_minio_client()
    extra: dict[str, str] = {}
    if filename:
        extra["response-content-disposition"] = f'attachment; filename="{filename}"'
    return client.presigned_get_object(
        settings.MINIO_BUCKET,
        key,
        expires=timedelta(seconds=settings.MINIO_PRESIGN_TTL_SECONDS),
        response_headers=extra or None,
    )
