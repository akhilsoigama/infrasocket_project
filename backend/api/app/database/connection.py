"""Database connection and session management."""

import logging
from typing import AsyncGenerator

from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from ..config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base."""
    pass


def get_sync_url() -> str:
    """Get synchronous database URL."""
    url = settings.database_url
    if url.startswith("postgresql://"):
        return url
    return url.replace("postgresql+asyncpg://", "postgresql://")


def get_async_url() -> str:
    """Get async database URL."""
    url = settings.database_url
    if "asyncpg" in url:
        return url
    return url.replace("postgresql://", "postgresql+asyncpg://")


# Synchronous engine (for migrations and simple operations)
sync_engine = create_engine(get_sync_url(), echo=False)
SyncSessionLocal = sessionmaker(bind=sync_engine, expire_on_commit=False)


def get_sync_session() -> Session:
    """Get a synchronous database session."""
    return SyncSessionLocal()


def check_database_connection() -> bool:
    """Check if the database is reachable."""
    try:
        with sync_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.warning("Database connection check failed: %s", e)
        return False


def init_database() -> None:
    """Create all tables (for demo/development)."""
    from .models import Base as ModelBase
    try:
        ModelBase.metadata.create_all(bind=sync_engine)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.warning("Could not create database tables: %s", e)
