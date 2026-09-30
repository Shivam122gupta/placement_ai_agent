import json
import gzip
import brotli
import pytest
from fastapi import FastAPI
from fastapi.responses import Response, JSONResponse
from fastapi.testclient import TestClient

from app.core.compression import CompressionMiddleware


@pytest.fixture
def compression_app():
    app = FastAPI()
    app.add_middleware(CompressionMiddleware, minimum_size=512, gzip_level=6, brotli_quality=4)

    @app.get("/large-json")
    def get_large_json():
        data = {
            "status": "success",
            "items": [
                {
                    "id": i,
                    "title": f"Software Engineer Role {i}",
                    "company": "Hirxora Enterprise",
                    "description": "High-throughput real-time AI placement pipeline and automated candidate evaluation engine.",
                }
                for i in range(40)
            ],
        }
        return JSONResponse(content=data)

    @app.get("/small-json")
    def get_small_json():
        return JSONResponse(content={"ok": True})

    @app.get("/image-png")
    def get_image():
        fake_png_data = b"\x89PNG\r\n\x1a\n" + (b"\x00" * 600)
        return Response(content=fake_png_data, media_type="image/png")

    return app


def test_brotli_compression(compression_app):
    client = TestClient(compression_app)
    response = client.get("/large-json", headers={"Accept-Encoding": "gzip, deflate, br"})

    assert response.status_code == 200
    assert response.headers.get("content-encoding") == "br"
    assert "Accept-Encoding" in response.headers.get("vary", "")

    # httpx auto-decompresses HTTP payload while preserving Content-Encoding header
    data = response.json()
    assert data["status"] == "success"
    assert len(data["items"]) == 40


def test_gzip_fallback_compression(compression_app):
    client = TestClient(compression_app)
    response = client.get("/large-json", headers={"Accept-Encoding": "gzip, deflate"})

    assert response.status_code == 200
    assert response.headers.get("content-encoding") == "gzip"
    assert "Accept-Encoding" in response.headers.get("vary", "")

    # httpx auto-decompresses HTTP payload while preserving Content-Encoding header
    data = response.json()
    assert data["status"] == "success"
    assert len(data["items"]) == 40


def test_no_compression_when_identity_requested(compression_app):
    client = TestClient(compression_app)
    response = client.get("/large-json", headers={"Accept-Encoding": "identity"})

    assert response.status_code == 200
    assert response.headers.get("content-encoding") is None
    assert "Accept-Encoding" in response.headers.get("vary", "")

    data = response.json()
    assert data["status"] == "success"
    assert len(data["items"]) == 40


def test_small_response_below_threshold_not_compressed(compression_app):
    client = TestClient(compression_app)
    response = client.get("/small-json", headers={"Accept-Encoding": "br, gzip"})

    assert response.status_code == 200
    assert response.headers.get("content-encoding") is None
    assert response.json() == {"ok": True}


def test_excluded_binary_content_type_not_compressed(compression_app):
    client = TestClient(compression_app)
    response = client.get("/image-png", headers={"Accept-Encoding": "br, gzip"})

    assert response.status_code == 200
    assert response.headers.get("content-encoding") is None
    assert response.headers.get("content-type") == "image/png"
