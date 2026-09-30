import gzip
try:
    import brotli
except ImportError:
    brotli = None

from typing import Optional, List, Tuple
from starlette.types import ASGIApp, Scope, Receive, Send, Message

# Standard text and structured data content types eligible for compression
COMPRESSIBLE_TYPES = {
    "application/json",
    "application/javascript",
    "application/x-javascript",
    "text/javascript",
    "text/html",
    "text/plain",
    "text/css",
    "text/xml",
    "application/xml",
    "image/svg+xml",
    "text/csv",
}

# Already-compressed binary & media formats explicitly excluded from compression
EXCLUDED_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "video/mp4",
    "video/webm",
    "audio/mpeg",
    "audio/ogg",
    "application/zip",
    "application/x-gzip",
    "application/pdf",
    "application/octet-stream",
}


class CompressionMiddleware:
    """
    Production-grade HTTP response compression middleware for FastAPI/Starlette.
    - Prefers Brotli ('br') where supported by client Accept-Encoding header.
    - Falls back to Gzip ('gzip') if Brotli is not advertised or installed.
    - Enforces a minimum response size threshold (default 512 bytes).
    - Prevents double-compression on already-compressed media/binary types.
    - Appends 'Vary: Accept-Encoding' for CDN & cache safety.
    """

    def __init__(
        self,
        app: ASGIApp,
        minimum_size: int = 512,
        gzip_level: int = 6,
        brotli_quality: int = 4,
    ) -> None:
        self.app = app
        self.minimum_size = minimum_size
        self.gzip_level = gzip_level
        self.brotli_quality = brotli_quality

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Parse Accept-Encoding from request headers
        accept_encoding = ""
        for name, value in scope.get("headers", []):
            if name.lower() == b"accept-encoding":
                accept_encoding = value.decode("latin-1").lower()
                break

        encoding = None
        if "br" in accept_encoding and brotli is not None:
            encoding = "br"
        elif "gzip" in accept_encoding:
            encoding = "gzip"

        responder = CompressionResponder(
            self.app,
            encoding=encoding,
            minimum_size=self.minimum_size,
            gzip_level=self.gzip_level,
            brotli_quality=self.brotli_quality,
        )
        await responder(scope, receive, send)


class CompressionResponder:
    def __init__(
        self,
        app: ASGIApp,
        encoding: str,
        minimum_size: int,
        gzip_level: int,
        brotli_quality: int,
    ) -> None:
        self.app = app
        self.encoding = encoding
        self.minimum_size = minimum_size
        self.gzip_level = gzip_level
        self.brotli_quality = brotli_quality
        self.send: Send = unhandled_send
        self.initial_message: Optional[Message] = None
        self.started = False
        self.should_compress = False
        self.body_buffer = bytearray()

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        self.send = send
        await self.app(scope, receive, self.send_wrapper)

    async def send_wrapper(self, message: Message) -> None:
        message_type = message["type"]

        if message_type == "http.response.start":
            self.initial_message = message
            headers = message.get("headers", [])

            content_type = ""
            has_content_encoding = False
            vary_present = False

            new_headers: List[Tuple[bytes, bytes]] = []
            for name, value in headers:
                name_lower = name.lower()
                if name_lower == b"content-type":
                    content_type = value.decode("latin-1").split(";")[0].strip().lower()
                elif name_lower == b"content-encoding":
                    has_content_encoding = True
                elif name_lower == b"vary":
                    vary_present = True
                    if b"accept-encoding" not in value.lower():
                        value = value + b", Accept-Encoding"
                new_headers.append((name, value))

            if not vary_present:
                new_headers.append((b"Vary", b"Accept-Encoding"))

            self.initial_message["headers"] = new_headers

            # Determine if this content type is eligible for compression
            is_compressible = (
                self.encoding is not None
                and not has_content_encoding
                and content_type not in EXCLUDED_TYPES
                and (
                    content_type in COMPRESSIBLE_TYPES
                    or content_type.startswith("text/")
                    or content_type.endswith("+json")
                    or content_type.endswith("+xml")
                )
            )
            self.should_compress = is_compressible
            return

        elif message_type == "http.response.body":
            body = message.get("body", b"")
            more_body = message.get("more_body", False)

            if not self.should_compress or (more_body and not self.started):
                # If streaming or not compressible, pass through uncompressed
                if not self.started:
                    self.started = True
                    await self.send(self.initial_message)
                await self.send(message)
                return

            self.body_buffer.extend(body)

            if more_body:
                return

            raw_body = bytes(self.body_buffer)
            if len(raw_body) < self.minimum_size:
                # Below minimum size threshold: send uncompressed
                self.started = True
                await self.send(self.initial_message)
                await self.send(
                    {"type": "http.response.body", "body": raw_body, "more_body": False}
                )
                return

            # Compress body using negotiated encoding
            if self.encoding == "br" and brotli is not None:
                compressed_body = brotli.compress(raw_body, quality=self.brotli_quality)
            else:
                self.encoding = "gzip"
                compressed_body = gzip.compress(raw_body, compresslevel=self.gzip_level)

            # Update headers with Content-Encoding and Content-Length
            final_headers: List[Tuple[bytes, bytes]] = []
            for name, value in self.initial_message["headers"]:
                name_lower = name.lower()
                if name_lower == b"content-length":
                    continue
                final_headers.append((name, value))

            final_headers.append((b"Content-Encoding", self.encoding.encode("latin-1")))
            final_headers.append((b"Content-Length", str(len(compressed_body)).encode("latin-1")))

            self.initial_message["headers"] = final_headers
            self.started = True
            await self.send(self.initial_message)
            await self.send(
                {"type": "http.response.body", "body": compressed_body, "more_body": False}
            )


async def unhandled_send(message: Message) -> None:
    raise RuntimeError("send handler not initialized")
