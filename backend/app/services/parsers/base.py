import re
from abc import ABC, abstractmethod
from pathlib import Path


class BaseDocumentParser(ABC):
    @abstractmethod
    def extract_text(self, file_path: Path) -> str:
        """Extract clean raw text from document."""
        pass

    @staticmethod
    def clean_text(text: str) -> str:
        """Sanitize text by removing null bytes, normalizing spaces and line breaks."""
        if not text:
            return ""
        # Remove null characters
        text = text.replace("\x00", "")
        # Normalize carriage returns
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Strip each line and collapse internal whitespace
        lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
        # Remove empty lines while collapsing multiple newlines
        cleaned = "\n".join(lines)
        cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
        return cleaned.strip()
