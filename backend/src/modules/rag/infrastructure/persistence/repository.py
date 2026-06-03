from typing import List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select, delete
from ...domain.entities.chunk import Chunk
from ...domain.repositories.chunk_repository import IChunkRepository
from .models import ChunkModel


class SQLModelChunkRepository(IChunkRepository):
    def __init__(self, session: AsyncSession):
        self._session = session

    async def sauvegarder_batch(self, chunks: List[Chunk]) -> None:
        for chunk in chunks:
            model = ChunkModel(
                id=chunk.id,
                ressource_id=chunk.ressource_id,
                contenu=chunk.contenu,
                indice=chunk.indice,
                taille_tokens=chunk.taille_tokens,
                modele_embedding=chunk.modele_embedding,
            )
            self._session.add(model)
        await self._session.commit()

    async def trouver_par_ressource(self, ressource_id: uuid.UUID) -> List[Chunk]:
        stmt = select(ChunkModel).where(ChunkModel.ressource_id == ressource_id).order_by(ChunkModel.indice)
        result = await self._session.execute(stmt)
        return [
            Chunk(
                id=m.id,
                ressource_id=m.ressource_id,
                contenu=m.contenu,
                indice=m.indice,
                taille_tokens=m.taille_tokens,
                vecteur_id=m.vecteur_id,
                modele_embedding=m.modele_embedding,
            )
            for m in result.scalars()
        ]

    async def supprimer_par_ressource(self, ressource_id: uuid.UUID) -> None:
        await self._session.execute(
            delete(ChunkModel).where(ChunkModel.ressource_id == ressource_id)
        )
        await self._session.commit()
