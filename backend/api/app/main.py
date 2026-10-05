"""FastAPI application for InfraSocket.

Main entry point for the API server that provides:
- REST endpoints for stations, events, signals, analytics
- WebSocket endpoint for real-time data streaming
- Demo control endpoints
"""

import logging
import os
import sys

# Add the backend root to sys.path so sibling packages can be imported.
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database.connection import check_database_connection, init_database
from .routes import analytics, demo, events, health, signals, stations
from .websocket.manager import ws_manager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="InfraSocket API",
    description="AI-Powered Infrasound Monitoring & Anomaly Detection System",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .routes import analytics, demo, events, health, signals, stations

# Register routes
app.include_router(health.router, prefix="/api")
app.include_router(stations.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(signals.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(demo.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Initialize database and seed data on startup."""
    logger.info("InfraSocket API starting up...")
    db_ok = check_database_connection()
    if db_ok:
        init_database()
        logger.info("Database connected and initialized")
    else:
        logger.warning(
            "Database not available — running in memory-only mode. "
            "Events will not be persisted."
        )


@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time signal data.

    Clients connect here to receive live waveform, metrics,
    AI status, and event notifications.
    """
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client can also send commands
            data = await websocket.receive_text()
            logger.debug("WS received: %s", data)
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "InfraSocket API",
        "version": "1.0.0",
        "description": "AI-Powered Infrasound Monitoring & Anomaly Detection",
        "docs": "/docs",
    }
