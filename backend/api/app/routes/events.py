"""Event endpoints."""

from fastapi import APIRouter, HTTPException, Query

from ..database.repositories.events import EventRepository
from ..schemas import EventDetailResponse, EventResponse
from ..services.demo_service import demo_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventResponse])
async def get_events(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Get recent events."""
    db_events = EventRepository.get_events(limit=limit, offset=offset)
    memory_events = demo_service.events_in_memory

    # Merge DB and memory events, prefer DB
    db_ids = {e["event_id"] for e in db_events}
    all_events = list(db_events)
    for me in memory_events:
        if me["event_id"] not in db_ids:
            all_events.append(me)

    # Sort by timestamp descending
    all_events.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return [EventResponse(**e) for e in all_events[:limit]]


@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(event_id: str):
    """Get a specific event with details."""
    event = EventRepository.get_event(event_id)
    if not event:
        # Check memory events
        for me in demo_service.events_in_memory:
            if me["event_id"] == event_id:
                return EventDetailResponse(**me)
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    return EventDetailResponse(**event)
