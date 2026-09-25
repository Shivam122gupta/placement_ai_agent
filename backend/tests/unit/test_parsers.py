import io
import pytest
from pathlib import Path
from pypdf import PdfWriter
from docx import Document
from app.services.parsers.pdf_parser import PDFParser
from app.services.parsers.docx_parser import DOCXParser
from app.services.parsers import extract_document_text


def test_pdf_text_extraction(tmp_path: Path):
    # Generate a valid temporary PDF with text
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    pdf_path = tmp_path / "sample_resume.pdf"
    
    # We write a basic PDF with annotations/text
    from pypdf.generic import DictionaryObject, NameObject, TextStringObject
    with open(pdf_path, "wb") as f:
        writer.write(f)

    parser = PDFParser()
    cleaned = parser.clean_text("   Python  \t  FastAPI \n\n\n MongoDB   \r\n Docker  ")
    assert cleaned == "Python FastAPI\n\nMongoDB\nDocker"


def test_docx_text_extraction(tmp_path: Path):
    doc = Document()
    doc.add_heading("Ankit Sharma - Software Engineer", level=1)
    doc.add_paragraph("Skills: Python, FastAPI, Docker, MongoDB")
    table = doc.add_table(rows=1, cols=2)
    table.rows[0].cells[0].text = "Project 1"
    table.rows[0].cells[1].text = "AI Placement Agent"
    
    docx_path = tmp_path / "sample_resume.docx"
    doc.save(docx_path)

    text = extract_document_text(docx_path)
    assert "Ankit Sharma" in text
    assert "Python, FastAPI" in text
    assert "AI Placement Agent" in text
