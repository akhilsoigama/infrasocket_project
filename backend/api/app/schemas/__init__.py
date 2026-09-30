"""Pydantic schemas for API request/response models."""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


# --- Enums ---

class DataSourceType(str, Enum):
    DEMO = "demo"
    DATASET = "dataset"
    LIVE_SENSOR = "live_sensor"


class EventTypeEnum(str, Enum):
    BACKGROUND = "background"
    MICROBAROM_LIKE = "possible_microbarom_like"
    EXPLOSION_LIKE = "possible_explosion_like"
    METEOR_LIKE = "possible_meteor_like"
    VOLCANIC_LIKE = "possible_volcanic_like"
    RANDOM_ANOMALY = "random_anomaly"


# --- Health ---

class HealthResponse(BaseModel):
    status: str
    version: str
    database: bool
    demo_mode: bool
    uptime_seconds: float


# --- Station ---

class StationResponse(BaseModel):
    station_id: str
    name: str
    latitude: float = 0.0
    longitude: float = 0.0
    elevation: float = 0.0
    sample_rate: float = 100.0
    is_online: bool = True
    signal_quality: float = 0.0
    last_seen: Optional[str] = None


# --- Signal ---

class SignalResponse(BaseModel):
    station_id: str
    timestamp: str
    sample_rate: float
    samples: list[float]
    n_samples: int
    event_type: str = "background"


class FFTResponse(BaseModel):
    frequencies: list[float]
    magnitudes: list[float]
    n_fft: int
    frequency_resolution: float


class SpectrogramResponse(BaseModel):
    times: list[float]
    frequencies: list[float]
    magnitudes: list[list[float]]
    nperseg: int
    noverlap: int


class SignalFeaturesResponse(BaseModel):
    peak_amplitude: float = 0.0
    rms: float = 0.0
    energy: float = 0.0
    snr_db: float = 0.0
    dominant_frequency_hz: float = 0.0
    spectral_centroid_hz: float = 0.0
    zero_crossing_rate: float = 0.0
    duration_seconds: float = 0.0


# --- Event ---

class EventResponse(BaseModel):
    event_id: str
    station_id: str
    event_type: str
    timestamp: str
    duration_seconds: float = 0.0
    amplitude: float = 0.0
    snr_db: float = 0.0
    is_anomaly: bool = False
    confidence: float = 0.0
    status: str = "detected"
    is_demo: bool = True


class EventDetailResponse(EventResponse):
    features: Optional[dict] = None
    predictions: Optional[list[dict]] = None


# --- Analytics ---

class AnalyticsSummaryResponse(BaseModel):
    active_stations: int = 0
    events_today: int = 0
    anomalies_detected: int = 0
    data_points_processed: int = 0
    stream_status: dict = Field(default_factory=dict)
    ai_stats: dict = Field(default_factory=dict)


# --- Demo ---

class DemoStartRequest(BaseModel):
    station_id: str = "INFRA-001"
    source: DataSourceType = DataSourceType.DEMO


class DemoStopRequest(BaseModel):
    pass


class InjectEventRequest(BaseModel):
    event_type: EventTypeEnum = EventTypeEnum.RANDOM_ANOMALY
    station_id: str = "INFRA-001"


class DemoStatusResponse(BaseModel):
    running: bool
    paused: bool
    source: str
    sample_rate: float


# --- Analysis ---

class AnalysisRequest(BaseModel):
    station_id: str = "INFRA-001"
    n_samples: int = 1024


class AnalysisResponse(BaseModel):
    processed_signal: list[float]
    features: dict
    fft: Optional[dict] = None
    spectrogram: Optional[dict] = None
    anomaly: Optional[dict] = None
    classification: Optional[dict] = None


# --- WebSocket messages ---

class WaveformMessage(BaseModel):
    type: str = "waveform"
    station_id: str
    timestamp: str
    sample_rate: float
    samples: list[float]
    event_type: str = "background"


class EventMessage(BaseModel):
    type: str = "event"
    event_id: str
    station_id: str
    is_anomaly: bool
    event_type: str
    confidence: float
    timestamp: str


class MetricsMessage(BaseModel):
    type: str = "metrics"
    station_id: str
    rms: float
    snr_db: float
    peak_amplitude: float
    dominant_frequency_hz: float
    signal_quality: float


class AIStatusMessage(BaseModel):
    type: str = "ai_status"
    is_anomaly: bool
    score: float
    event_type: str
    confidence: float
    model_version: str
    is_demo: bool = True
