"""Event repository for database operations."""

import logging
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import desc

from ..connection import get_sync_session
from ..models import Event, EventFeature, ModelPrediction

logger = logging.getLogger(__name__)


class EventRepository:
    """Database operations for events."""

    @staticmethod
    def create_event(
        station_id: str,
        event_type: str,
        duration: float,
        amplitude: float,
        snr: float,
        is_anomaly: bool,
        confidence: float,
        features: Optional[dict] = None,
        anomaly_result: Optional[dict] = None,
    ) -> Optional[dict]:
        """Create a new event in the database.

        Returns:
            Event dict or None if DB is unavailable.
        """
        try:
            session = get_sync_session()
            event_id = str(uuid.uuid4())

            event = Event(
                event_id=event_id,
                station_ref=station_id,
                event_type=event_type,
                timestamp=datetime.utcnow(),
                duration_seconds=duration,
                amplitude=amplitude,
                snr_db=snr,
                is_anomaly=is_anomaly,
                confidence=confidence,
                status="detected",
                is_demo=True,
            )
            session.add(event)

            # Store features
            if features:
                ef = EventFeature(
                    event_id=event_id,
                    peak_amplitude=features.get("peak_amplitude", 0),
                    rms=features.get("rms", 0),
                    energy=features.get("energy", 0),
                    snr_db=features.get("snr_db", 0),
                    dominant_frequency_hz=features.get("dominant_frequency_hz", 0),
                    spectral_centroid_hz=features.get("spectral_centroid_hz", 0),
                    zero_crossing_rate=features.get("zero_crossing_rate", 0),
                    duration_seconds=features.get("duration_seconds", 0),
                )
                session.add(ef)

            # Store prediction
            if anomaly_result:
                pred = ModelPrediction(
                    event_id=event_id,
                    model_name="IsolationForest",
                    model_version=anomaly_result.get("model_version", "demo-v1"),
                    is_anomaly=is_anomaly,
                    anomaly_score=anomaly_result.get("score", 0),
                    event_type=event_type,
                    confidence=confidence,
                    is_demo=True,
                )
                session.add(pred)

            session.commit()
            logger.info("Created event: %s (%s)", event_id, event_type)

            result = {
                "event_id": event_id,
                "station_id": station_id,
                "event_type": event_type,
                "timestamp": event.timestamp.isoformat() + "Z",
                "duration_seconds": duration,
                "amplitude": amplitude,
                "snr_db": snr,
                "is_anomaly": is_anomaly,
                "confidence": confidence,
                "status": "detected",
                "is_demo": True,
            }
            session.close()
            return result

        except Exception as e:
            logger.warning("Could not create event in DB: %s", e)
            # Return a memory-only event
            return {
                "event_id": str(uuid.uuid4()),
                "station_id": station_id,
                "event_type": event_type,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "duration_seconds": duration,
                "amplitude": amplitude,
                "snr_db": snr,
                "is_anomaly": is_anomaly,
                "confidence": confidence,
                "status": "detected",
                "is_demo": True,
                "db_stored": False,
            }

    @staticmethod
    def get_events(limit: int = 50, offset: int = 0) -> list[dict]:
        """Get recent events."""
        try:
            session = get_sync_session()
            events = (
                session.query(Event)
                .order_by(desc(Event.timestamp))
                .offset(offset)
                .limit(limit)
                .all()
            )
            result = []
            for e in events:
                result.append({
                    "event_id": e.event_id,
                    "station_id": e.station_ref,
                    "event_type": e.event_type,
                    "timestamp": e.timestamp.isoformat() + "Z" if e.timestamp else "",
                    "duration_seconds": e.duration_seconds,
                    "amplitude": e.amplitude,
                    "snr_db": e.snr_db,
                    "is_anomaly": e.is_anomaly,
                    "confidence": e.confidence,
                    "status": e.status,
                    "is_demo": e.is_demo,
                })
            session.close()
            return result
        except Exception as e:
            logger.warning("Could not fetch events from DB: %s", e)
            return []

    @staticmethod
    def get_event(event_id: str) -> Optional[dict]:
        """Get a single event by ID."""
        try:
            session = get_sync_session()
            event = (
                session.query(Event)
                .filter(Event.event_id == event_id)
                .first()
            )
            if not event:
                session.close()
                return None

            features_dict = None
            if event.features:
                f = event.features
                features_dict = {
                    "peak_amplitude": f.peak_amplitude,
                    "rms": f.rms,
                    "energy": f.energy,
                    "snr_db": f.snr_db,
                    "dominant_frequency_hz": f.dominant_frequency_hz,
                    "spectral_centroid_hz": f.spectral_centroid_hz,
                    "zero_crossing_rate": f.zero_crossing_rate,
                    "duration_seconds": f.duration_seconds,
                }

            predictions = []
            for p in event.predictions:
                predictions.append({
                    "model_name": p.model_name,
                    "model_version": p.model_version,
                    "is_anomaly": p.is_anomaly,
                    "anomaly_score": p.anomaly_score,
                    "event_type": p.event_type,
                    "confidence": p.confidence,
                    "is_demo": p.is_demo,
                })

            result = {
                "event_id": event.event_id,
                "station_id": event.station_ref,
                "event_type": event.event_type,
                "timestamp": event.timestamp.isoformat() + "Z" if event.timestamp else "",
                "duration_seconds": event.duration_seconds,
                "amplitude": event.amplitude,
                "snr_db": event.snr_db,
                "is_anomaly": event.is_anomaly,
                "confidence": event.confidence,
                "status": event.status,
                "is_demo": event.is_demo,
                "features": features_dict,
                "predictions": predictions,
            }
            session.close()
            return result
        except Exception as e:
            logger.warning("Could not fetch event %s: %s", event_id, e)
            return None

    @staticmethod
    def count_events() -> dict:
        """Get event counts."""
        try:
            session = get_sync_session()
            total = session.query(Event).count()
            anomalies = session.query(Event).filter(Event.is_anomaly.is_(True)).count()
            session.close()
            return {"total": total, "anomalies": anomalies, "normal": total - anomalies}
        except Exception:
            return {"total": 0, "anomalies": 0, "normal": 0}
