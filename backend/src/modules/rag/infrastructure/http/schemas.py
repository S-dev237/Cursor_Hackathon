from typing import List
from pydantic import BaseModel


class QuestionRequest(BaseModel):
    question: str
    nb_contextes: int = 5


class SourceDTO(BaseModel):
    chunk_id: str
    ressource_id: str
    contenu: str
    score: float


class QuestionResponse(BaseModel):
    reponse: str
    sources: List[SourceDTO]


class RechercheRequest(BaseModel):
    requete: str
    limite: int = 10


class RechercheResponse(BaseModel):
    chunk_id: str
    ressource_id: str
    contenu: str
    score: float
