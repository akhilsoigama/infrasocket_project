"""Signal data endpoints."""

from fastapi import APIRouter

from ..schemas import FFTResponse, SignalResponse, SpectrogramResponse
from ..services.demo_service import demo_service

router = APIRouter(prefix="/signal", tags=["signals"])


@router.get("/latest", response_model=SignalResponse)
async def get_latest_signal():
    """Get the latest signal buffer."""
    data = demo_service.get_latest_signal()
    return SignalResponse(
        station_id=data.get("station_id", "INFRA-001"),
        timestamp=data.get("timestamp", ""),
        sample_rate=data.get("sample_rate", 100.0),
        samples=data.get("samples", []),
        n_samples=data.get("n_samples", 0),
    )


@router.get("/fft", response_model=FFTResponse)
async def get_fft():
    """Get FFT of the latest signal buffer."""
    data = demo_service.get_latest_fft()
    return FFTResponse(
        frequencies=data.get("frequencies", []),
        magnitudes=data.get("magnitudes", []),
        n_fft=data.get("n_fft", 0),
        frequency_resolution=data.get("frequency_resolution", 0),
    )


@router.get("/spectrogram", response_model=SpectrogramResponse)
async def get_spectrogram():
    """Get spectrogram of the latest signal buffer."""
    data = demo_service.get_latest_spectrogram()
    return SpectrogramResponse(
        times=data.get("times", []),
        frequencies=data.get("frequencies", []),
        magnitudes=data.get("magnitudes", []),
        nperseg=data.get("nperseg", 0),
        noverlap=data.get("noverlap", 0),
    )
