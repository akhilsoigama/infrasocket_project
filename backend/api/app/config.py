"""Application configuration loaded from environment variables."""

import os
from dataclasses import dataclass, field


@dataclass
class Settings:
    """Application settings."""

    # Database
    database_url: str = field(
        default_factory=lambda: os.getenv(
            "DATABASE_URL",
            "postgresql://postgres:password@localhost:5432/infrasocket",
        )
    )

    # API
    api_host: str = field(default_factory=lambda: os.getenv("API_HOST", "0.0.0.0"))
    api_port: int = field(
        default_factory=lambda: int(os.getenv("API_PORT", "8000"))
    )

    # CORS
    cors_origins: list[str] = field(
        default_factory=lambda: os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
        ).split(",")
    )

    # Demo
    demo_mode: bool = field(
        default_factory=lambda: os.getenv("DEMO_MODE", "true").lower() == "true"
    )
    demo_sample_rate: float = field(
        default_factory=lambda: float(os.getenv("DEMO_SAMPLE_RATE", "100.0"))
    )
    demo_chunk_size: int = field(
        default_factory=lambda: int(os.getenv("DEMO_CHUNK_SIZE", "256"))
    )

    # WebSocket
    ws_interval_ms: int = field(
        default_factory=lambda: int(os.getenv("WS_INTERVAL_MS", "100"))
    )


settings = Settings()
