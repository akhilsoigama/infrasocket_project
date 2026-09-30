"""Station management endpoints."""

from fastapi import APIRouter, HTTPException

from ..database.repositories.stations import StationRepository
from ..schemas import StationResponse

router = APIRouter(prefix="/stations", tags=["stations"])


@router.get("", response_model=list[StationResponse])
async def get_stations():
    """Get all monitoring stations."""
    stations = StationRepository.get_stations()
    return [StationResponse(**s) for s in stations]


@router.get("/{station_id}", response_model=StationResponse)
async def get_station(station_id: str):
    """Get a specific station by ID."""
    station = StationRepository.get_station(station_id)
    if not station:
        raise HTTPException(status_code=404, detail=f"Station {station_id} not found")
    return StationResponse(**station)
