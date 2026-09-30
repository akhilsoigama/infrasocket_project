"""WebSocket connection manager."""

import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections for real-time data streaming."""

    def __init__(self) -> None:
        self._connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self._connections.append(websocket)
        logger.info(
            "WebSocket client connected (total: %d)", len(self._connections)
        )

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        if websocket in self._connections:
            self._connections.remove(websocket)
        logger.info(
            "WebSocket client disconnected (total: %d)", len(self._connections)
        )

    async def broadcast(self, data: dict[str, Any]) -> None:
        """Broadcast a message to all connected clients.

        Disconnects clients that fail to receive.
        """
        disconnected: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect(ws)

    async def send_personal(self, websocket: WebSocket, data: dict) -> None:
        """Send a message to a specific client."""
        try:
            await websocket.send_json(data)
        except Exception:
            self.disconnect(websocket)

    @property
    def connection_count(self) -> int:
        """Number of active connections."""
        return len(self._connections)

    @property
    def is_connected(self) -> bool:
        """Whether any clients are connected."""
        return len(self._connections) > 0


# Global WebSocket manager instance
ws_manager = ConnectionManager()
