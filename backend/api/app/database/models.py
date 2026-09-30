"""SQLAlchemy database models for InfraSocket.

These models store event metadata, station information,
and AI predictions. Raw waveform data is NOT stored in
PostgreSQL — it remains in memory/files for the demo.
"""

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .connection import Base


class Station(Base):
    """Monitoring station metadata."""

    __tablename__ = "stations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    station_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    latitude = Column(Float, default=0.0)
    longitude = Column(Float, default=0.0)
    elevation = Column(Float, default=0.0)
    sample_rate = Column(Float, default=100.0)
    is_online = Column(Boolean, default=True)
    signal_quality = Column(Float, default=0.0)
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    events = relationship("Event", back_populates="station")


class Event(Base):
    """Detected infrasound event metadata."""

    __tablename__ = "events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(100), unique=True, nullable=False, index=True)
    station_ref = Column(
        String(50), ForeignKey("stations.station_id"), nullable=False
    )
    event_type = Column(String(100), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    duration_seconds = Column(Float, default=0.0)
    amplitude = Column(Float, default=0.0)
    snr_db = Column(Float, default=0.0)
    is_anomaly = Column(Boolean, default=False)
    confidence = Column(Float, default=0.0)
    status = Column(String(50), default="detected")
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    station = relationship("Station", back_populates="events")
    features = relationship("EventFeature", back_populates="event", uselist=False)
    predictions = relationship("ModelPrediction", back_populates="event")


class EventFeature(Base):
    """Extracted features for an event."""

    __tablename__ = "event_features"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(
        String(100), ForeignKey("events.event_id"), nullable=False, unique=True
    )
    peak_amplitude = Column(Float, default=0.0)
    rms = Column(Float, default=0.0)
    energy = Column(Float, default=0.0)
    snr_db = Column(Float, default=0.0)
    dominant_frequency_hz = Column(Float, default=0.0)
    spectral_centroid_hz = Column(Float, default=0.0)
    zero_crossing_rate = Column(Float, default=0.0)
    duration_seconds = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="features")


class ModelPrediction(Base):
    """AI model prediction records."""

    __tablename__ = "model_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(
        String(100), ForeignKey("events.event_id"), nullable=False
    )
    model_name = Column(String(100), nullable=False)
    model_version = Column(String(50), nullable=False)
    is_anomaly = Column(Boolean, default=False)
    anomaly_score = Column(Float, default=0.0)
    event_type = Column(String(100), default="unknown")
    confidence = Column(Float, default=0.0)
    is_demo = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    event = relationship("Event", back_populates="predictions")


class SystemStatus(Base):
    """System status snapshots."""

    __tablename__ = "system_status"

    id = Column(Integer, primary_key=True, autoincrement=True)
    component = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    message = Column(Text, default="")
    timestamp = Column(DateTime, default=datetime.utcnow)
