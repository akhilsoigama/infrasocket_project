"""Demo control endpoints."""

from fastapi import APIRouter

from ..schemas import (
    AnalysisRequest,
    AnalysisResponse,
    DemoStartRequest,
    DemoStatusResponse,
    InjectEventRequest,
)
from ..services.demo_service import demo_service

router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/start")
async def start_demo(request: DemoStartRequest = DemoStartRequest()):
    """Start the demo signal pipeline."""
    result = await demo_service.start(station_id=request.station_id)
    return result


@router.post("/stop")
async def stop_demo():
    """Stop the demo signal pipeline."""
    result = await demo_service.stop()
    return result


@router.post("/pause")
async def pause_demo():
    """Pause the demo signal pipeline."""
    result = await demo_service.pause()
    return result


@router.post("/resume")
async def resume_demo():
    """Resume the demo signal pipeline."""
    result = await demo_service.resume()
    return result


@router.post("/inject-event")
async def inject_event(request: InjectEventRequest = InjectEventRequest()):
    """Inject an event into the demo signal stream."""
    result = demo_service.inject_event(request.event_type.value)
    return result


@router.get("/status", response_model=DemoStatusResponse)
async def demo_status():
    """Get current demo status."""
    status = demo_service.status
    return DemoStatusResponse(
        running=status["running"],
        paused=status["paused"],
        source=status["source"],
        sample_rate=status["sample_rate"],
    )


@router.post("/analysis", response_model=AnalysisResponse)
async def run_analysis(request: AnalysisRequest = AnalysisRequest()):
    """Run full signal analysis on current buffer."""
    result = demo_service.run_analysis(n_samples=request.n_samples)
    if "error" in result:
        return AnalysisResponse(
            processed_signal=[],
            features={},
        )
    return AnalysisResponse(**result)
