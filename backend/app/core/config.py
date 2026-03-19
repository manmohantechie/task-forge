from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "TaskForge"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "your-secret-key-change-in-production"

    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/taskforge"

    # Redis / Celery
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # Worker
    WORKER_CONCURRENCY: int = 4
    MAX_RETRIES: int = 3
    RETRY_BACKOFF: int = 60  # seconds

    # Queue names
    DEFAULT_QUEUE: str = "default"
    HIGH_PRIORITY_QUEUE: str = "high"
    LOW_PRIORITY_QUEUE: str = "low"
    EMAIL_QUEUE: str = "email"
    ANALYTICS_QUEUE: str = "analytics"

    class Config:
        env_file = ".env"


settings = Settings()
