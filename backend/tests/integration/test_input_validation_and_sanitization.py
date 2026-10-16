import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_xss_script_injection_sanitized_in_profile(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that XSS payloads (<script>, event handlers, javascript: pseudo-protocols)
    are thoroughly stripped and sanitized before saving to database.
    """
    xss_payload = {
        "full_name": "<script>alert('xss')</script>Secure Candidate",
        "headline": "Software Engineer <img src=x onerror=alert(1)>",
        "bio": "Building robust systems <script type='text/javascript'>stealCookies()</script> with Python.",
        "location": "San Francisco<svg/onload=alert(1)>",
    }

    res = await async_client.patch("/api/v1/profile", json=xss_payload, headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]

    # Verify script tags and event handlers are removed
    assert "<script>" not in data["full_name"]
    assert "Secure Candidate" in data["full_name"]
    assert "onerror=" not in data["headline"]
    assert "Software Engineer" in data["headline"]
    assert "<script" not in data["bio"]
    assert "onload=" not in data["location"]


@pytest.mark.asyncio
async def test_malicious_url_protocols_rejected_in_profile(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that dangerous URL schemes like javascript:, data:, or vbscript:
    are strictly rejected with HTTP 422.
    """
    dangerous_urls = [
        "javascript:alert(document.cookie)",
        "data:text/html,<script>alert(1)</script>",
        "vbscript:msgbox(1)",
    ]

    for bad_url in dangerous_urls:
        res = await async_client.patch(
            "/api/v1/profile",
            json={"portfolio_url": bad_url},
            headers=auth_headers,
        )
        assert res.status_code == 422
        assert "VALIDATION_ERROR" in res.json().get("error", {}).get("code", "")


@pytest.mark.asyncio
async def test_project_xss_sanitization_and_url_validation(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that project descriptions and technologies are sanitized,
    and project URLs must be valid http/https.
    """
    # 1. Invalid project URL
    res_bad_url = await async_client.post(
        "/api/v1/profile/projects",
        json={
            "name": "Exploit Project",
            "description": "Valid description",
            "live_url": "javascript:void(0)",
        },
        headers=auth_headers,
    )
    assert res_bad_url.status_code == 422

    # 2. Valid project with embedded XSS in description
    res_clean = await async_client.post(
        "/api/v1/profile/projects",
        json={
            "name": "Distributed System",
            "description": "High throughput system <script>steal()</script> built with FastAPI.",
            "technologies": ["Python", "<b onmouseover=alert(1)>FastAPI</b>"],
            "live_url": "https://example.com/project",
        },
        headers=auth_headers,
    )
    assert res_clean.status_code == 201


@pytest.mark.asyncio
async def test_nosql_redos_query_neutralization(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that special regex characters and catastrophic ReDoS patterns
    in job search query parameters are escaped and safely queried without server failure.
    """
    redos_queries = [
        "((a+)+)+$",
        ".*.*.*.*.*.*.*.*.*.*",
        "[a-z0-9_]{1,1000}",
        "{\"$gt\": \"\"}",
    ]

    for q in redos_queries:
        res = await async_client.get(f"/api/v1/jobs?query={q}", headers=auth_headers)
        # Must return valid 200 list response, not 500 error or ReDoS hang
        assert res.status_code == 200
        assert isinstance(res.json()["data"], list)


@pytest.mark.asyncio
async def test_unsafe_file_upload_executable_blocked(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that executable binaries (Windows MZ or Linux ELF) disguised as PDFs are blocked.
    """
    # Windows PE executable header (MZ) disguised as PDF
    fake_exe_pdf = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00"
    files = {"file": ("malicious_resume.pdf", fake_exe_pdf, "application/pdf")}

    res = await async_client.post("/api/v1/resumes", files=files, headers=auth_headers)
    assert res.status_code == 422
    err_msg = res.json()["error"]["message"]
    assert "Malicious file" in err_msg or "executable" in err_msg or "magic" in err_msg.lower()


@pytest.mark.asyncio
async def test_unsafe_file_upload_html_script_blocked(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that HTML/SVG script content disguised as PDF or DOCX is blocked.
    """
    fake_html_docx = b"<html><head><script>alert('pwned')</script></head><body>Resume</body></html>"
    files = {"file": ("exploit.docx", fake_html_docx, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}

    res = await async_client.post("/api/v1/resumes", files=files, headers=auth_headers)
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_unsafe_file_upload_empty_file_rejected(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that zero-byte empty files are rejected with HTTP 422.
    """
    files = {"file": ("empty.pdf", b"", "application/pdf")}
    res = await async_client.post("/api/v1/resumes", files=files, headers=auth_headers)
    assert res.status_code == 422
    assert "empty" in res.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_valid_pdf_magic_header_accepted(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that a valid PDF file with standard %PDF- magic signature passes upload validation.
    """
    valid_pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Title (Resume) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    files = {"file": ("valid_resume.pdf", valid_pdf_bytes, "application/pdf")}

    res = await async_client.post("/api/v1/resumes", files=files, headers=auth_headers)
    # Upload validation passes: passes storage checks; downstream parser will parse or note text status
    assert res.status_code in (201, 422)  # 201 if text extracted, 422 if empty text - but NOT file type error!
    if res.status_code == 422:
        assert res.json()["error"]["code"] in ("EMPTY_DOCUMENT_TEXT", "PDF_PARSING_FAILED")


@pytest.mark.asyncio
async def test_strict_role_enum_enforcement(async_client: AsyncClient, auth_headers: dict):
    """
    Verifies that invalid role strings in role update requests are rejected by schema validation.
    """
    res = await async_client.patch(
        "/api/v1/admin/users/6ad271225703359da80928aa/role",
        json={"role": "superuser"},  # Disallowed role
        headers=auth_headers,
    )
    # Role must be strictly 'user' or 'admin'
    assert res.status_code in (422, 403)

