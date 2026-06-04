import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class AuthorIn(BaseModel):
    family_name: str
    given_name: str
    affiliation: str | None = None
    orcid: str | None = None


class ItemPatch(BaseModel):
    title: str | None = None
    abstract: str | None = None
    language: str | None = Field(default=None, min_length=2, max_length=2)
    resource_type: str | None = None
    publication_year: int | None = None
    keywords: list[str] | None = None
    authors: list[AuthorIn] | None = None


class ItemOut(BaseModel):
    id: uuid.UUID
    submitter_id: uuid.UUID
    title: str
    abstract: str | None
    language: str | None
    resource_type: str | None
    publication_year: int | None
    status: str
    published_at: datetime | None
    created_at: datetime
    vector_status: str
    file_filename: str | None

    model_config = {"from_attributes": True}


class SearchResult(BaseModel):
    item: ItemOut
    score: float
    download_url: str | None = None
