"""Stream manager for continuous signal data delivery.

Coordinates the generator/dataset with processing and AI pipelines,
managing the async streaming loop.
"""

import asyncio
import logging
from typing import AsyncGenerator, Optional

from .dataset import DatasetPlayer
from .generator import InfrasoundGenerator
from .models import DataSource, EventType, SignalChunk

logger = logging.getLogger(__name__)


class StreamManager:
    """Manages signal data streaming from various sources.

    Coordinates between demo generator, dataset player, and
    (future) live sensor inputs. Provides an async generator
    interface for downstream consumers.
    """

    def __init__(self, sample_rate: float = 100.0) -> None:
        self.sample_rate = sample_rate
        self.generator = InfrasoundGenerator(sample_rate=sample_rate)
        self.dataset_player = DatasetPlayer(sample_rate=sample_rate)
        self.data_source: DataSource = DataSource.DEMO
        self._running: bool = False
        self._paused: bool = False
        self._chunk_size: int = 256
        self._interval: float = self._chunk_size / sample_rate

    async def start(self, source: DataSource = DataSource.DEMO) -> None:
        """Start the signal stream.

        Args:
            source: Data source to stream from.
        """
        self.data_source = source
        self._running = True
        self._paused = False
        logger.info("Stream started (source=%s)", source.value)

    async def stop(self) -> None:
        """Stop the signal stream."""
        self._running = False
        self._paused = False
        if self.data_source == DataSource.DATASET:
            self.dataset_player.stop()
        logger.info("Stream stopped")

    async def pause(self) -> None:
        """Pause the signal stream."""
        self._paused = True
        if self.data_source == DataSource.DATASET:
            self.dataset_player.pause()
        logger.info("Stream paused")

    async def resume(self) -> None:
        """Resume the signal stream."""
        self._paused = False
        if self.data_source == DataSource.DATASET:
            self.dataset_player.play()
        logger.info("Stream resumed")

    def inject_event(self, event_type: EventType) -> Optional[dict]:
        """Inject an event into the demo signal stream.

        Args:
            event_type: Type of event to inject.

        Returns:
            Event descriptor dict, or None if not in demo mode.
        """
        if self.data_source != DataSource.DEMO:
            logger.warning("Event injection only available in demo mode")
            return None

        event = self.generator.inject_event(event_type)
        return {
            "event_id": event.event_id,
            "event_type": event.event_type.value,
            "station_id": event.station_id,
            "timestamp": event.timestamp,
            "duration_seconds": event.duration_seconds,
        }

    async def stream(
        self,
        station_id: str = "INFRA-001",
    ) -> AsyncGenerator[SignalChunk, None]:
        """Async generator that yields signal chunks.

        Args:
            station_id: Station identifier.

        Yields:
            SignalChunk objects at the configured rate.
        """
        while self._running:
            if self._paused:
                await asyncio.sleep(0.1)
                continue

            chunk = self._get_next_chunk(station_id)
            if chunk is not None:
                yield chunk

            await asyncio.sleep(self._interval)

    def _get_next_chunk(self, station_id: str) -> Optional[SignalChunk]:
        """Get the next signal chunk from the active source.

        Args:
            station_id: Station identifier.

        Returns:
            SignalChunk or None.
        """
        if self.data_source == DataSource.DEMO:
            return self.generator.generate_chunk(
                n_samples=self._chunk_size,
                station_id=station_id,
            )
        elif self.data_source == DataSource.DATASET:
            return self.dataset_player.get_next_chunk(
                chunk_size=self._chunk_size,
                station_id=station_id,
            )
        else:
            # Live sensor: future implementation
            return None

    @property
    def is_running(self) -> bool:
        """Check if the stream is currently running."""
        return self._running and not self._paused

    @property
    def status(self) -> dict:
        """Get current stream status."""
        return {
            "running": self._running,
            "paused": self._paused,
            "source": self.data_source.value,
            "sample_rate": self.sample_rate,
            "chunk_size": self._chunk_size,
            "has_pending_event": self.generator.has_pending_event,
        }
