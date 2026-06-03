from typing import List
from ..entities.chunk import Chunk
import uuid


class ChunkingService:
    """
    Découpe un texte brut en Chunks avec chevauchement (overlap).
    Stratégie : fenêtre glissante par tokens approximatifs.
    """

    def __init__(self, taille: int = 500, chevauchement: int = 50):
        self._taille = taille
        self._chevauchement = chevauchement

    def decouper(self, ressource_id: uuid.UUID, texte: str) -> List[Chunk]:
        mots = texte.split()
        chunks: List[Chunk] = []
        debut = 0
        indice = 0

        while debut < len(mots):
            fin = min(debut + self._taille, len(mots))
            contenu = " ".join(mots[debut:fin])
            chunks.append(Chunk.creer(
                ressource_id=ressource_id,
                contenu=contenu,
                indice=indice,
            ))
            indice += 1
            debut += self._taille - self._chevauchement

        return chunks
