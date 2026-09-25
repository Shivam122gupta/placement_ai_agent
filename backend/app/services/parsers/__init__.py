from pathlib import Path
from app.services.parsers.pdf_parser import PDFParser
from app.services.parsers.docx_parser import DOCXParser
from app.core.exceptions import ValidationError

_pdf_parser = PDFParser()
_docx_parser = DOCXParser()


def extract_document_text(file_path: Path) -> str:
    ext = file_path.suffix.lower()
    if ext == ".pdf":
        return _pdf_parser.extract_text(file_path)
    elif ext == ".docx":
        return _docx_parser.extract_text(file_path)
    else:
        raise ValidationError(f"No parser available for file format '{ext}'", code="UNSUPPORTED_FORMAT")


__all__ = ["PDFParser", "DOCXParser", "extract_document_text"]
