import logging
from pathlib import Path
from pypdf import PdfReader
from app.services.parsers.base import BaseDocumentParser
from app.core.exceptions import ValidationError

logger = logging.getLogger("app.parsers.pdf")


class PDFParser(BaseDocumentParser):
    def extract_text(self, file_path: Path) -> str:
        try:
            reader = PdfReader(str(file_path))
            pages_text = []
            
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            
            full_text = "\n\n".join(pages_text)
            cleaned = self.clean_text(full_text)
            
            if not cleaned:
                logger.warning(f"PDF {file_path.name} yielded 0 characters of text.")
            return cleaned
        except Exception as e:
            logger.error(f"Failed to extract text from PDF {file_path}: {e}")
            raise ValidationError(f"Could not parse PDF file: {str(e)}", code="PDF_PARSING_FAILED")
