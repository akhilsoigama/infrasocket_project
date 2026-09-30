"""Analytics summary endpoint."""

from fastapi import APIRouter

from ..database.repositories.events import EventRepository
from ..database.repositories.stations import StationRepository
from ..schemas import AnalyticsSummaryResponse
from ..services.demo_service import demo_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_analytics_summary():
    """Get analytics summary."""
    stations = StationRepository.get_stations()
    active_stations = sum(1 for s in stations if s.get("is_online", False))

    event_counts = EventRepository.count_events()
    memory_events = len(demo_service.events_in_memory)

    return AnalyticsSummaryResponse(
        active_stations=active_stations,
        events_today=event_counts["total"] + memory_events,
        anomalies_detected=event_counts["anomalies"]
        + sum(1 for e in demo_service.events_in_memory if e.get("is_anomaly")),
        data_points_processed=demo_service.status["data_points"],
        stream_status=demo_service.status,
        ai_stats=demo_service.inference_engine.stats,
    )
