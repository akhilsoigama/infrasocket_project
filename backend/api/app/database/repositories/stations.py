"""Station repository for database operations."""

import logging
from datetime import datetime
from typing import Optional

from ..connection import get_sync_session
from ..models import Station

logger = logging.getLogger(__name__)

# Default demo stations
DEMO_STATIONS = [
    {
        "station_id": "IMA1",
        "name": "IMA Beirut - Channel 1",
        "latitude": 33.8938,
        "longitude": 35.5018,
        "elevation": 10.0,
        "sample_rate": 40.0,
        "is_online": True,
    },
    {
        "station_id": "IMA2",
        "name": "IMA Beirut - Channel 2",
        "latitude": 33.8938,
        "longitude": 35.5018,
        "elevation": 10.0,
        "sample_rate": 40.0,
        "is_online": True,
    },
    {
        "station_id": "IMA3",
        "name": "IMA Beirut - Channel 3",
        "latitude": 33.8938,
        "longitude": 35.5018,
        "elevation": 10.0,
        "sample_rate": 40.0,
        "is_online": True,
    },
    {
        "station_id": "IMA4",
        "name": "IMA Beirut - Channel 4",
        "latitude": 33.8938,
        "longitude": 35.5018,
        "elevation": 10.0,
        "sample_rate": 40.0,
        "is_online": True,
    },
    {
        "station_id": "ENCR1",
        "name": "ENCR1 Station (Single)",
        "latitude": 34.0522,
        "longitude": -118.2437,
        "elevation": 85.0,
        "sample_rate": 20.0,
        "is_online": True,
    }
]


class StationRepository:
    """Database operations for stations."""

    @staticmethod
    def seed_stations() -> None:
        """Seed the database with demo stations."""
        try:
            session = get_sync_session()
            for s in DEMO_STATIONS:
                existing = (
                    session.query(Station)
                    .filter(Station.station_id == s["station_id"])
                    .first()
                )
                if not existing:
                    station = Station(**s)
                    session.add(station)
            session.commit()
            session.close()
            logger.info("Demo stations seeded")
        except Exception as e:
            logger.warning("Could not seed stations: %s", e)

    @staticmethod
    def get_stations() -> list[dict]:
        """Get all stations."""
        try:
            session = get_sync_session()
            stations = session.query(Station).all()
            result = []
            for s in stations:
                result.append({
                    "station_id": s.station_id,
                    "name": s.name,
                    "latitude": s.latitude,
                    "longitude": s.longitude,
                    "elevation": s.elevation,
                    "sample_rate": s.sample_rate,
                    "is_online": s.is_online,
                    "signal_quality": s.signal_quality,
                    "last_seen": s.last_seen.isoformat() + "Z" if s.last_seen else None,
                })
            session.close()
            return result if result else DEMO_STATIONS
        except Exception:
            return DEMO_STATIONS

    @staticmethod
    def get_station(station_id: str) -> Optional[dict]:
        """Get a single station."""
        try:
            session = get_sync_session()
            s = (
                session.query(Station)
                .filter(Station.station_id == station_id)
                .first()
            )
            if not s:
                session.close()
                # Fallback to demo data
                for ds in DEMO_STATIONS:
                    if ds["station_id"] == station_id:
                        return ds
                return None
            result = {
                "station_id": s.station_id,
                "name": s.name,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "elevation": s.elevation,
                "sample_rate": s.sample_rate,
                "is_online": s.is_online,
                "signal_quality": s.signal_quality,
                "last_seen": s.last_seen.isoformat() + "Z" if s.last_seen else None,
            }
            session.close()
            return result
        except Exception:
            for ds in DEMO_STATIONS:
                if ds["station_id"] == station_id:
                    return ds
            return None

    @staticmethod
    def update_signal_quality(station_id: str, quality: float) -> None:
        """Update station signal quality."""
        try:
            session = get_sync_session()
            station = (
                session.query(Station)
                .filter(Station.station_id == station_id)
                .first()
            )
            if station:
                station.signal_quality = quality
                station.last_seen = datetime.utcnow()
                session.commit()
            session.close()
        except Exception as e:
            logger.warning("Could not update station quality: %s", e)
