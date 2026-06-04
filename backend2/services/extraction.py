"""Extraction de texte depuis PDF/XML."""
from __future__ import annotations
import io
import fitz  # pymupdf
from lxml import etree


MIN_TEXT_THRESHOLD = 100


def extract_pdf_text(data: bytes, max_pages: int = 8) -> str:
    doc = fitz.open(stream=data, filetype="pdf")
    try:
        pages: list[str] = []
        for i, page in enumerate(doc):
            if i >= max_pages:
                break
            pages.append(page.get_text("text"))
        return "\n".join(pages).strip()
    finally:
        doc.close()


def extract_xml_text(data: bytes) -> str:
    try:
        tree = etree.parse(io.BytesIO(data))
        return " ".join(t.strip() for t in tree.getroot().itertext() if t and t.strip())
    except etree.XMLSyntaxError:
        return ""


def extract_text(data: bytes, mime: str | None) -> tuple[str, str]:
    """Retourne (texte, méthode_utilisée)."""
    mime = (mime or "").lower()
    if "xml" in mime:
        return extract_xml_text(data), "lxml"
    text = extract_pdf_text(data)
    return text, "pymupdf"
