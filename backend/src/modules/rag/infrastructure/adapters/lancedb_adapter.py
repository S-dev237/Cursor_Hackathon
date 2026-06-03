from typing import List
import lancedb
import pyarrow as pa
from ...domain.ports.vecteur_store_port import IVecteurStorePort, ResultatRecherche
from src.shared.infrastructure.settings import get_settings

settings = get_settings()

_SCHEMA = pa.schema([
    pa.field("chunk_id", pa.string()),
    pa.field("ressource_id", pa.string()),
    pa.field("contenu", pa.string()),
    pa.field("vecteur", pa.list_(pa.float32(), settings.embedding_dim)),
])


class LanceDBAdapter(IVecteurStorePort):
    """
    Adaptateur LanceDB pour le stockage et la recherche vectorielle.
    Base de données vectorielle embedded (pas de serveur séparé).
    """
    _TABLE_NAME = "chunks"

    def __init__(self):
        self._db = lancedb.connect(settings.lancedb_uri)
        self._table = self._get_or_create_table()

    def _get_or_create_table(self):
        existing = self._db.table_names()
        if self._TABLE_NAME not in existing:
            return self._db.create_table(self._TABLE_NAME, schema=_SCHEMA)
        return self._db.open_table(self._TABLE_NAME)

    async def indexer(self, chunk_id: str, ressource_id: str, contenu: str, vecteur: List[float]) -> None:
        self._table.add([{
            "chunk_id": chunk_id,
            "ressource_id": ressource_id,
            "contenu": contenu,
            "vecteur": vecteur,
        }])

    async def rechercher(self, vecteur: List[float], limite: int = 5) -> List[ResultatRecherche]:
        results = (
            self._table.search(vecteur, vector_column_name="vecteur")
            .limit(limite)
            .to_list()
        )
        return [
            ResultatRecherche(
                chunk_id=r["chunk_id"],
                ressource_id=r["ressource_id"],
                contenu=r["contenu"],
                score=float(r.get("_distance", 0.0)),
            )
            for r in results
        ]

    async def supprimer_ressource(self, ressource_id: str) -> None:
        self._table.delete(f"ressource_id = '{ressource_id}'")
