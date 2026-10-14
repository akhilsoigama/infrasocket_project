"""API routes package."""

from .analytics import router as analytics_router
from .calibration import router as calibration_router
from .demo import router as demo_router
from .events import router as events_router
from .hardware import router as hardware_router
from .health import router as health_router
from .signals import router as signals_router
from .stations import router as stations_router

from . import analytics, calibration, demo, events, hardware, health, signals, stations

__all__ = [
    "analytics_router",
    "calibration_router",
    "demo_router",
    "events_router",
    "hardware_router",
    "health_router",
    "signals_router",
    "stations_router",
    "analytics",
    "calibration",
    "demo",
    "events",
    "hardware",
    "health",
    "signals",
    "stations",
]
