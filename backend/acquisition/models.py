"""Data models for the acquisition module."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional

import numpy as np


class EventType(str, Enum):
    """Types of infrasound events (synthetic demo labels)."""

    BACKGROUND = "background"
    MICROBAROM_LIKE = "possible_microbarom_like"
    EXPLOSION_LIKE = "possible_explosion_like"
    METEOR_LIKE = "possible_meteor_like"
    VOLCANIC_LIKE = "possible_volcanic_like"
    RANDOM_ANOMALY = "random_anomaly"


class DataSource(str, Enum):
    """Data source modes."""

    DEMO = "demo"
    DATASET = "dataset"
    LIVE_SENSOR = "live_sensor"


@dataclass
class StationConfig:
    """Configuration for a monitoring station."""

    station_id: str
    name: str
    sample_rate: float = 100.0
    latitude: float = 0.0
    longitude: float = 0.0
    elevation: float = 0.0
    is_online: bool = True


@dataclass
class SignalChunk:
    """A chunk of signal data with metadata."""

    station_id: str
    timestamp: str
    sample_rate: float
    samples: list[float] = field(default_factory=list)
    event_type: EventType = EventType.BACKGROUND
    duration_seconds: float = 0.0

    @classmethod
    def from_numpy(
        cls,
        station_id: str,
        samples: np.ndarray,
        sample_rate: float,
        event_type: EventType = EventType.BACKGROUND,
        timestamp: Optional[str] = None,
    ) -> "SignalChunk":
        """Create a SignalChunk from a NumPy array."""
        ts = timestamp or datetime.utcnow().isoformat() + "Z"
        return cls(
            station_id=station_id,
            timestamp=ts,
            sample_rate=sample_rate,
            samples=samples.tolist(),
            event_type=event_type,
            duration_seconds=len(samples) / sample_rate,
        )

    def to_numpy(self) -> np.ndarray:
        """Convert samples to NumPy array."""
        return np.array(self.samples, dtype=np.float64)


@dataclass
class InjectedEvent:
    """An event injected into the signal stream."""

    event_id: str
    event_type: EventType
    station_id: str
    timestamp: str
    duration_seconds: float
    amplitude_factor: float = 1.0
    injected: bool = True
