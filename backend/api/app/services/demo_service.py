"""Demo streaming service.

Manages the complete demo pipeline:
Generator → Signal Processing → AI → WebSocket → Database
"""

import asyncio
import logging
import uuid
from datetime import datetime
from typing import Optional

import numpy as np

from ....acquisition.generator import InfrasoundGenerator
from ....acquisition.models import DataSource, EventType
from ....acquisition.stream import StreamManager
from ....ai.inference import InferenceEngine
from ....signal_processing.features import extract_features, features_to_vector
from ....signal_processing.pipeline import process_signal
from ..database.repositories.events import EventRepository
from ..database.repositories.stations import StationRepository
from ..websocket.manager import ws_manager

logger = logging.getLogger(__name__)


class DemoService:
    """Manages the demo signal generation and processing pipeline.

    This is the central orchestrator that connects:
    - Signal generation
    - Signal processing
    - AI inference
    - WebSocket broadcasting
    - Database persistence
    """

    def __init__(self) -> None:
        self.stream_manager = StreamManager(sample_rate=100.0)
        self.inference_engine = InferenceEngine()
        self._task: Optional[asyncio.Task] = None
        self._running: bool = False
        self._paused: bool = False
        self._data_points: int = 0
        self._signal_buffer: list[float] = []
        self._buffer_max: int = 2048
        self._last_features: dict = {}
        self._last_ai_result: dict = {}
        self._events_in_memory: list[dict] = []

    async def start(self, station_id: str = "INFRA-001") -> dict:
        """Start the demo pipeline.

        Args:
            station_id: Station to stream from.

        Returns:
            Status dict.
        """
        if self._running:
            return {"status": "already_running"}

        # Initialize AI
        self.inference_engine.initialize()

        # Seed stations
        StationRepository.seed_stations()

        self._running = True
        self._paused = False
        await self.stream_manager.start(DataSource.DEMO)

        # Start the streaming loop
        self._task = asyncio.create_task(
            self._stream_loop(station_id)
        )

        logger.info("Demo pipeline started")
        return {"status": "started", "station_id": station_id}

    async def stop(self) -> dict:
        """Stop the demo pipeline."""
        self._running = False
        self._paused = False
        await self.stream_manager.stop()

        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        logger.info("Demo pipeline stopped")
        return {"status": "stopped"}

    async def pause(self) -> dict:
        """Pause the demo pipeline."""
        self._paused = True
        await self.stream_manager.pause()
        return {"status": "paused"}

    async def resume(self) -> dict:
        """Resume the demo pipeline."""
        self._paused = False
        await self.stream_manager.resume()
        return {"status": "resumed"}

    def inject_event(self, event_type: str) -> dict:
        """Inject an event into the signal stream.

        Args:
            event_type: Event type string.

        Returns:
            Injection result.
        """
        try:
            et = EventType(event_type)
        except ValueError:
            et = EventType.RANDOM_ANOMALY

        result = self.stream_manager.inject_event(et)
        if result:
            return {"status": "injected", **result}
        return {"status": "failed", "reason": "not in demo mode"}

    async def _stream_loop(self, station_id: str) -> None:
        """Main streaming loop that processes and broadcasts data."""
        chunk_size = 256
        sample_rate = 100.0
        interval = chunk_size / sample_rate  # ~2.56 seconds worth

        # Use shorter interval for smoother updates
        broadcast_interval = 0.1  # 100ms

        generator = self.stream_manager.generator
        samples_per_broadcast = int(sample_rate * broadcast_interval)

        while self._running:
            if self._paused:
                await asyncio.sleep(0.1)
                continue

            try:
                # Generate chunk
                chunk = generator.generate_chunk(
                    n_samples=samples_per_broadcast,
                    station_id=station_id,
                )

                samples = chunk.to_numpy()
                self._data_points += len(samples)

                # Add to buffer
                self._signal_buffer.extend(chunk.samples)
                if len(self._signal_buffer) > self._buffer_max:
                    self._signal_buffer = self._signal_buffer[-self._buffer_max:]

                # Process signal (every few chunks for efficiency)
                buffer_np = np.array(self._signal_buffer, dtype=np.float64)

                # Extract features from recent window
                features = extract_features(samples, sample_rate)
                self._last_features = features

                # AI analysis
                feature_vec = features_to_vector(features)
                ai_result = self.inference_engine.analyze_window(
                    samples, sample_rate
                )
                self._last_ai_result = ai_result

                # Calculate signal quality (0-100)
                signal_quality = min(100.0, max(0.0, features["snr_db"] * 3 + 50))

                # Broadcast waveform data
                await ws_manager.broadcast({
                    "type": "waveform",
                    "station_id": station_id,
                    "timestamp": chunk.timestamp,
                    "sample_rate": sample_rate,
                    "samples": chunk.samples,
                    "event_type": chunk.event_type.value
                    if hasattr(chunk.event_type, "value")
                    else str(chunk.event_type),
                })

                # Broadcast metrics
                await ws_manager.broadcast({
                    "type": "metrics",
                    "station_id": station_id,
                    "rms": round(features["rms"], 6),
                    "snr_db": round(features["snr_db"], 2),
                    "peak_amplitude": round(features["peak_amplitude"], 6),
                    "dominant_frequency_hz": round(
                        features["dominant_frequency_hz"], 3
                    ),
                    "signal_quality": round(signal_quality, 1),
                })

                # Broadcast AI status
                anomaly_info = ai_result.get("anomaly", {})
                classification = ai_result.get("classification", {})
                await ws_manager.broadcast({
                    "type": "ai_status",
                    "is_anomaly": anomaly_info.get("is_anomaly", False),
                    "score": anomaly_info.get("score", 0.0),
                    "event_type": classification.get("event_type", "background"),
                    "confidence": classification.get("confidence", 0.0),
                    "model_version": anomaly_info.get("model_version", "demo-v1"),
                    "is_demo": True,
                })

                # If anomaly detected, create event
                if anomaly_info.get("is_anomaly", False):
                    event_data = EventRepository.create_event(
                        station_id=station_id,
                        event_type=classification.get(
                            "event_type", "unknown_anomaly"
                        ),
                        duration=features["duration_seconds"],
                        amplitude=features["peak_amplitude"],
                        snr=features["snr_db"],
                        is_anomaly=True,
                        confidence=classification.get("confidence", 0.0),
                        features=features,
                        anomaly_result=anomaly_info,
                    )

                    if event_data:
                        self._events_in_memory.append(event_data)

                        # Broadcast event
                        await ws_manager.broadcast({
                            "type": "event",
                            "event_id": event_data["event_id"],
                            "station_id": station_id,
                            "is_anomaly": True,
                            "event_type": event_data["event_type"],
                            "confidence": event_data["confidence"],
                            "timestamp": event_data["timestamp"],
                        })

                # Update station quality
                StationRepository.update_signal_quality(
                    station_id, signal_quality
                )

            except Exception as e:
                logger.error("Stream loop error: %s", e, exc_info=True)

            await asyncio.sleep(broadcast_interval)

    def get_latest_signal(self) -> dict:
        """Get the latest signal buffer."""
        return {
            "samples": self._signal_buffer[-512:] if self._signal_buffer else [],
            "sample_rate": 100.0,
            "n_samples": min(len(self._signal_buffer), 512),
            "station_id": "INFRA-001",
            "timestamp": datetime.utcnow().isoformat() + "Z",
        }

    def get_latest_fft(self) -> dict:
        """Compute FFT on latest buffer."""
        from ....signal_processing.fft import compute_fft

        if not self._signal_buffer or len(self._signal_buffer) < 64:
            return {"frequencies": [], "magnitudes": [], "n_fft": 0, "frequency_resolution": 0}

        data = np.array(self._signal_buffer[-1024:], dtype=np.float64)
        return compute_fft(data, 100.0)

    def get_latest_spectrogram(self) -> dict:
        """Compute spectrogram on latest buffer."""
        from ....signal_processing.spectrogram import compute_stft

        if not self._signal_buffer or len(self._signal_buffer) < 128:
            return {
                "times": [], "frequencies": [],
                "magnitudes": [], "nperseg": 0, "noverlap": 0
            }

        data = np.array(self._signal_buffer[-2048:], dtype=np.float64)
        return compute_stft(data, 100.0, nperseg=128)

    def run_analysis(self, n_samples: int = 1024) -> dict:
        """Run full analysis on recent data."""
        if not self._signal_buffer or len(self._signal_buffer) < n_samples:
            return {"error": "Insufficient data"}

        data = np.array(self._signal_buffer[-n_samples:], dtype=np.float64)
        result = process_signal(data, 100.0)

        ai_result = self.inference_engine.analyze_window(data, 100.0)

        return {
            "processed_signal": result["processed_signal"],
            "features": result["features"],
            "fft": result["fft"],
            "spectrogram": result["spectrogram"],
            "anomaly": ai_result.get("anomaly"),
            "classification": ai_result.get("classification"),
        }

    @property
    def status(self) -> dict:
        """Get current demo status."""
        return {
            "running": self._running,
            "paused": self._paused,
            "source": "demo",
            "sample_rate": 100.0,
            "data_points": self._data_points,
            "buffer_size": len(self._signal_buffer),
            "ws_clients": ws_manager.connection_count,
            "ai_ready": self.inference_engine.is_ready,
        }

    @property
    def events_in_memory(self) -> list[dict]:
        """Get events stored in memory."""
        return self._events_in_memory


# Global demo service instance
demo_service = DemoService()
