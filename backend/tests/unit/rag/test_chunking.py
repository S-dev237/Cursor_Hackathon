import uuid
from src.modules.rag.domain.services.chunking_service import ChunkingService


def test_decouper_texte_court():
    service = ChunkingService(taille=10, chevauchement=2)
    texte = "mot " * 15  # 15 mots
    ressource_id = uuid.uuid4()
    chunks = service.decouper(ressource_id, texte)
    assert len(chunks) > 0
    for i, chunk in enumerate(chunks):
        assert chunk.indice == i
        assert chunk.ressource_id == ressource_id


def test_chevauchement():
    service = ChunkingService(taille=5, chevauchement=2)
    mots = ["a", "b", "c", "d", "e", "f", "g", "h"]
    texte = " ".join(mots)
    chunks = service.decouper(uuid.uuid4(), texte)
    # Chunk 0 : a b c d e
    # Chunk 1 : d e f g h (chevauchement de 2)
    assert "d" in chunks[1].contenu
