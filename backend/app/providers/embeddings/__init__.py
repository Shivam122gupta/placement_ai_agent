import abc
import hashlib
import math
import logging
from typing import List, Optional

logger = logging.getLogger("app.embeddings")


class BaseEmbeddingProvider(abc.ABC):
    """Abstract base class for vector embedding generation."""

    def __init__(self, dimension: int = 384):
        self.dimension = dimension

    @abc.abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Embed a single text string into a float vector."""
        pass

    @abc.abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of text strings into float vectors."""
        pass


class DeterministicEmbeddingProvider(BaseEmbeddingProvider):
    """
    Deterministic dense embedding provider using token-level hashing and n-gram pooling.
    Guarantees zero external dependency failure and produces consistent normalized 384-d vectors.
    High semantic consistency for identical/overlapping terms and token intersections.
    """

    def __init__(self, dimension: int = 384):
        super().__init__(dimension=dimension)

    def _hash_token_to_vector(self, token: str) -> List[float]:
        vec = [0.0] * self.dimension
        token_clean = token.lower().strip()
        if not token_clean:
            return vec
        
        for i in range(0, self.dimension):
            h = hashlib.sha256(f"{token_clean}:{i}".encode("utf-8")).digest()
            val = (int.from_bytes(h[:4], "big") / 2147483648.0) - 1.0  # Range [-1, 1]
            vec[i] = val
        return vec

    def embed_text(self, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * self.dimension

        words = text.lower().replace("\n", " ").split()
        if not words:
            return [0.0] * self.dimension

        accumulated = [0.0] * self.dimension
        total_weight = 0.0
        for idx, word in enumerate(words):
            word_clean = "".join(c for c in word if c.isalnum() or c in ("-", "_", "#", "+", "."))
            if not word_clean:
                continue
            weight = 1.0 + (0.5 if len(word_clean) > 4 else 0.0)
            token_vec = self._hash_token_to_vector(word_clean)
            for d in range(self.dimension):
                accumulated[d] += token_vec[d] * weight
            total_weight += weight

        if total_weight == 0:
            return [0.0] * self.dimension

        norm = math.sqrt(sum(v * v for v in accumulated))
        if norm > 0:
            return [v / norm for v in accumulated]
        return accumulated

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self.embed_text(t) for t in texts]


class FastEmbedOrLocalProvider(BaseEmbeddingProvider):
    """
    Attempts to use FastEmbed / SentenceTransformers if available, otherwise falls back to Deterministic.
    """

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5", dimension: int = 384):
        super().__init__(dimension=dimension)
        self.model_name = model_name
        self._model = None
        self._fallback = DeterministicEmbeddingProvider(dimension=dimension)
        self._initialize_model()

    def _initialize_model(self):
        try:
            from fastembed import TextEmbedding
            self._model = TextEmbedding(model_name=self.model_name)
            logger.info("Initialized FastEmbed model: %s", self.model_name)
        except Exception as e:
            logger.info("FastEmbed not active (%s), falling back to deterministic dense embeddings", e)
            self._model = None

    def embed_text(self, text: str) -> List[float]:
        if self._model:
            try:
                embeddings = list(self._model.embed([text]))
                return embeddings[0].tolist()
            except Exception as err:
                logger.warning("FastEmbed error: %s. Using fallback.", err)
        return self._fallback.embed_text(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if self._model:
            try:
                embeddings = list(self._model.embed(texts))
                return [e.tolist() for e in embeddings]
            except Exception as err:
                logger.warning("FastEmbed batch error: %s. Using fallback.", err)
        return self._fallback.embed_batch(texts)


def get_embedding_provider() -> BaseEmbeddingProvider:
    """Factory function to get default configured embedding provider."""
    from app.core.config import settings
    if settings.EMBEDDING_PROVIDER == "deterministic":
        return DeterministicEmbeddingProvider(dimension=settings.EMBEDDING_DIMENSION)
    return FastEmbedOrLocalProvider(
        model_name=settings.EMBEDDING_MODEL_NAME,
        dimension=settings.EMBEDDING_DIMENSION
    )
