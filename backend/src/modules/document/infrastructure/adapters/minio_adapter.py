from typing import BinaryIO
from miniopy_async import Minio
from ...domain.ports.stockage_port import IStockagePort
from src.shared.infrastructure.settings import get_settings

settings = get_settings()


# Cache des clients de signature par endpoint public (la génération d'URL
# présignée ne fait aucun appel réseau : seul l'hôte signé importe).
_signing_clients: dict[tuple[str, bool], Minio] = {}


class MinioAdapter(IStockagePort):
    def __init__(self):
        self._client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
            region=settings.minio_region,
        )

    def _signing_client(self, public_endpoint: str | None) -> Minio:
        """Client utilisé uniquement pour signer les URLs de téléchargement.

        Une URL présignée S3 (SigV4) inclut l'hôte dans sa signature : on doit
        donc signer avec l'hôte que le client utilisera réellement, sinon MinIO
        renverra 403. On signe avec `public_endpoint` (déduit de la requête ou
        configuré), à défaut avec l'endpoint interne.
        """
        endpoint = public_endpoint or settings.minio_public_endpoint or settings.minio_endpoint
        secure = settings.minio_public_secure if endpoint != settings.minio_endpoint else settings.minio_secure
        cle = (endpoint, secure)
        client = _signing_clients.get(cle)
        if client is None:
            client = Minio(
                endpoint=endpoint,
                access_key=settings.minio_access_key,
                secret_key=settings.minio_secret_key,
                secure=secure,
                region=settings.minio_region,
            )
            _signing_clients[cle] = client
        return client

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

    async def telecharger_url(
        self,
        bucket: str,
        key: str,
        expires: int = 3600,
        public_endpoint: str | None = None,
    ) -> str:
        from datetime import timedelta
        client = self._signing_client(public_endpoint)
        url = await client.presigned_get_object(bucket, key, expires=timedelta(seconds=expires))
        return url

    async def supprimer(self, bucket: str, key: str) -> None:
        await self._client.remove_object(bucket, key)
