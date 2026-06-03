from __future__ import annotations
import uuid
from dataclasses import dataclass
from typing import Optional


@dataclass
class Fichier:
    id: uuid.UUID
    ressource_id: uuid.UUID
    minio_bucket: str
    minio_key: str
    nom_original: str
    taille_octets: int
    type_mime: str = "application/pdf"
    checksum_sha256: Optional[str] = None

    @classmethod
    def creer(
        cls,
        ressource_id: uuid.UUID,
        minio_bucket: str,
        minio_key: str,
        nom_original: str,
        taille_octets: int,
        type_mime: str = "application/pdf",
        checksum_sha256: Optional[str] = None,
    ) -> "Fichier":
        return cls(
            id=uuid.uuid4(),
            ressource_id=ressource_id,
            minio_bucket=minio_bucket,
            minio_key=minio_key,
            nom_original=nom_original,
            taille_octets=taille_octets,
            type_mime=type_mime,
            checksum_sha256=checksum_sha256,
        )
