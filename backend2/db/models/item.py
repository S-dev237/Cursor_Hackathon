import uuid
from datetime import datetime
from sqlalchemy import String, Integer, BigInteger, Numeric, DateTime, ForeignKey, CHAR, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base


class Item(Base):
    __tablename__ = "item"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submitter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("app_user.id"), nullable=False, index=True)

    title: Mapped[str] = mapped_column(String, nullable=False, default="Untitled")
    abstract: Mapped[str | None] = mapped_column(String, nullable=True)
    language: Mapped[str] = mapped_column(CHAR(2), default="fr")
    resource_type: Mapped[str | None] = mapped_column(String, nullable=True)
    publication_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    status: Mapped[str] = mapped_column(String, nullable=False, default="draft", index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    file_storage_key: Mapped[str | None] = mapped_column(String, nullable=True)
    file_filename: Mapped[str | None] = mapped_column(String, nullable=True)
    file_mime_type: Mapped[str | None] = mapped_column(String, nullable=True)
    file_size_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    file_sha256: Mapped[str | None] = mapped_column(String, nullable=True)
    file_uploaded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    vector_status: Mapped[str] = mapped_column(String, default="pending", index=True)
    vector_indexed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String, nullable=True)

    ai_extracted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ai_confidence: Mapped[float | None] = mapped_column(Numeric(3, 2), nullable=True)

    download_count: Mapped[int] = mapped_column(Integer, default=0)


class Author(Base):
    __tablename__ = "author"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    family_name: Mapped[str] = mapped_column(String, nullable=False)
    given_name: Mapped[str] = mapped_column(String, nullable=False)
    affiliation: Mapped[str | None] = mapped_column(String, nullable=True)
    orcid: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)


class ItemAuthor(Base):
    __tablename__ = "item_author"
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("item.id", ondelete="CASCADE"), primary_key=True)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("author.id"), primary_key=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)


class ItemKeyword(Base):
    __tablename__ = "item_keyword"
    item_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("item.id", ondelete="CASCADE"), primary_key=True)
    keyword: Mapped[str] = mapped_column(String, primary_key=True)
