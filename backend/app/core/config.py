from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[".env", "../.env"],
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # 1. Project & Environment
    PROJECT_NAME: str = "AI Placement Agent"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v

    # 2. Database (MongoDB)
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "ai_placement_db"

    # 3. Security & JWT
    JWT_SECRET: str = "default_dev_jwt_secret_key_change_in_production_32char"
    JWT_REFRESH_SECRET: str = "default_dev_jwt_refresh_secret_key_change_in_prod"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # 4. LLM Providers
    LLM_PROVIDER: str = "groq"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    OPENAI_API_KEY: str = ""
    OPENAI_BASE_URL: str = "https://api.openai.com/v1"
    OPENAI_MODEL: str = "gpt-4o"

    # 5. Qdrant & Embeddings
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: str = ""
    EMBEDDING_PROVIDER: str = "local"
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIMENSION: int = 384

    # 6. Storage & Limits
    UPLOAD_STORAGE_DIR: str = "./storage/resumes"
    MAX_UPLOAD_SIZE_MB: int = 10

    # 7. Redis & Rate Limiting
    REDIS_URL: str = "redis://localhost:6379/0"
    RATE_LIMIT_PER_MINUTE: int = 60

    # 8. External Job Provider
    JOB_SEARCH_PROVIDER: str = "mock"
    JOB_SEARCH_API_KEY: str = ""

    # 9. Email & SMTP / Resend Settings
    EMAIL_PROVIDER: str = "auto"  # "auto", "resend", "smtp", "brevo"
    RESEND_API_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_TLS: bool = True
    EMAILS_FROM_EMAIL: str = "noreply@hirxora.ai"
    EMAILS_FROM_NAME: str = "Hirxora Career AI"
    FRONTEND_URL: str = "https://hirxora.vercel.app"


settings = Settings()
