from typing import BinaryIO
from miniopy_async import Minio
from ...domain.ports.stockage_port import IStockagePort
from src.shared.infrastructure.settings import get_settings

settings = get_settings()


class MinioAdapter(IStockagePort):
    def __init__(self):
        self._client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )

    async def creer_bucket_si_absent(self, bucket: str) -> None:
        exists = await self._client.bucket_exists(bucket)
        if not exists:
            await self._client.make_bucket(bucket)

    async def uploader(
        self,
        bucket: str,
        key: str,
        contenu: BinaryIO,
        taille: int,
        content_type: str = "application/pdf",
    ) -> str:
        await self._client.put_object(bucket, key, contenu, taille, content_type=content_type)
        return key

    async def telecharger_url(self, bucket: str, key: str, expires: int = 3600) -> str:
        from datetime import timedelta
        url = await self._client.presigned_get_object(bucket, key, expires=timedelta(seconds=expires))
        return url

    async def supprimer(self, bucket: str, key: str) -> None:
        await self._client.remove_object(bucket, key)
