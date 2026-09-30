"""Health check endpoint."""

import time

from fastapi import APIRouter

from ..config import settings
from ..database.connection import check_database_connection
from ..schemas import HealthResponse

router = APIRouter(tags=["health"])

_start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Check system health status."""
    db_ok = check_database_connection()
    return HealthResponse(
        status="operational" if db_ok else "degraded",
        version="1.0.0",
        database=db_ok,
        demo_mode=settings.demo_mode,
        uptime_seconds=round(time.time() - _start_time, 1),
    )
